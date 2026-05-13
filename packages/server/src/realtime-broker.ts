import { randomUUID } from "node:crypto";
import type { IncomingMessage } from "node:http";
import type { FastifyInstance } from "fastify";
import { WebSocket, WebSocketServer } from "ws";
import {
  canRoleAccess,
  consumeRealtimeSession,
  getRealtimeConfig,
  getSchemaBySlug,
  isRealtimeEventEnabled,
  listRealtimeEventsAfter,
  pruneRealtimeEvents,
  recordRealtimeEvent,
  resolveApiToken,
  type SqliteDatabase,
} from "apiagex-database";
import type {
  RealtimeBroker,
  RealtimeConnectionSnapshot,
  RealtimeEventMessage,
  RealtimePublishInput,
  RealtimeStoredEvent,
} from "./realtime-broker.type.js";

const ackTimeoutMs = 15000;
const heartbeatMs = 25000;
const retentionEventsPerSchema = 1000;

type ClientState = {
  id: string;
  connectedAt: string;
  schemaId: string;
  schemaSlug: string;
  pending: Map<string, NodeJS.Timeout>;
  heartbeat: NodeJS.Timeout;
};

export function createRealtimeBroker(database: SqliteDatabase): RealtimeBroker & {
  attach(server: FastifyInstance): void;
} {
  const wss = new WebSocketServer({ noServer: true });
  const clients = new Map<WebSocket, ClientState>();

  function attach(server: FastifyInstance): void {
    server.server.on("upgrade", (request, socket, head) => {
      const url = new URL(request.url ?? "", "http://apiagex.local");
      if (url.pathname !== "/api/realtime") return;
      wss.handleUpgrade(request, socket, head, (ws) => accept(ws, request, url));
    });
  }

  function accept(ws: WebSocket, _request: IncomingMessage, url: URL): void {
    const schema = getSchemaBySlug(database, url.searchParams.get("schema") ?? "");
    if (!schema) return closeWithError(ws, "SCHEMA_NOT_FOUND");
    if (!getRealtimeConfig(database, schema.id)?.enabled) return closeWithError(ws, "REALTIME_DISABLED");
    const access = canSubscribe(url, schema.id);
    if (!access.allowed) return closeWithError(ws, access.error ?? "API_PERMISSION_DENIED");
    const state: ClientState = {
      id: `rtc_${randomUUID()}`,
      connectedAt: new Date().toISOString(),
      schemaId: schema.id,
      schemaSlug: schema.slug,
      pending: new Map(),
      heartbeat: setInterval(() => send(ws, { type: "ping", sentAt: new Date().toISOString() }), heartbeatMs),
    };
    clients.set(ws, state);
    send(ws, {
      type: "ready",
      connectionId: state.id,
      schema: { id: schema.id, slug: schema.slug },
      heartbeatMs,
      ackTimeoutMs,
    });
    setTimeout(() => replayMissed(ws, state, url.searchParams.get("lastEventId"), url.searchParams.get("replayLimit")), 0);
    ws.on("message", (data) => handleMessage(ws, state, data.toString()));
    ws.on("close", () => cleanup(ws));
  }

  function publish(input: RealtimePublishInput): void {
    if (!isRealtimeEventEnabled(database, input.schema.id, input.eventType)) return;
    const stored = recordRealtimeEvent(database, {
      entry: input.entry,
      eventType: input.eventType,
      schemaId: input.schema.id,
      schemaSlug: input.schema.slug,
    });
    pruneHistory(input.schema.id);
    for (const [ws, state] of clients) {
      if (state.schemaId !== input.schema.id || ws.readyState !== WebSocket.OPEN) continue;
      sendEvent(ws, state, stored);
    }
  }

  function replayMissed(ws: WebSocket, state: ClientState, lastEventId: string | null, replayLimit: string | null): void {
    if (!lastEventId) return;
    const limit = parseReplayLimit(replayLimit);
    const events = listRealtimeEventsAfter(database, state.schemaId, lastEventId, limit);
    for (const event of events) sendEvent(ws, state, event, true);
  }

  function sendEvent(ws: WebSocket, state: ClientState, event: RealtimeStoredEvent, replayed = false): void {
    const message = eventMessage(event, replayed);
    const timer = setTimeout(() => {
      state.pending.delete(message.messageId);
      send(ws, { type: "ack.timeout", messageId: message.messageId, eventId: message.eventId });
    }, ackTimeoutMs);
    state.pending.set(message.messageId, timer);
    send(ws, message);
  }

  function snapshot(): RealtimeConnectionSnapshot[] {
    return [...clients.values()].map((client) => ({
      id: client.id,
      schemaId: client.schemaId,
      schemaSlug: client.schemaSlug,
      connectedAt: client.connectedAt,
      pendingAcks: client.pending.size,
    }));
  }

  function canSubscribe(url: URL, schemaId: string): { allowed: boolean; error?: string } {
    const session = url.searchParams.get("session")?.trim();
    const schemaSlug = url.searchParams.get("schema")?.trim() ?? "";
    if (session) {
      return consumeRealtimeSession(database, session, schemaSlug)
        ? { allowed: true }
        : { allowed: false, error: "REALTIME_SESSION_INVALID" };
    }
    const token = url.searchParams.get("token")?.trim();
    if (token) {
      const apiToken = resolveApiToken(database, token);
      if (!apiToken) return { allowed: false, error: "API_TOKEN_INVALID" };
      return { allowed: canRoleAccess(database, apiToken.roleId, schemaId, "getAll") };
    }
    const roleId = url.searchParams.get("roleId")?.trim();
    return roleId ? { allowed: canRoleAccess(database, roleId, schemaId, "getAll") } : { allowed: true };
  }

  function handleMessage(ws: WebSocket, state: ClientState, text: string): void {
    const message = parseClientMessage(text);
    if (message?.type === "ack" && typeof message.messageId === "string") {
      clearPending(state, message.messageId);
      send(ws, { type: "ack.ok", messageId: message.messageId, receivedAt: new Date().toISOString() });
    }
    if (message?.type === "pong") send(ws, { type: "pong.ok", receivedAt: new Date().toISOString() });
  }

  function cleanup(ws: WebSocket): void {
    const state = clients.get(ws);
    if (!state) return;
    clearInterval(state.heartbeat);
    for (const timer of state.pending.values()) clearTimeout(timer);
    clients.delete(ws);
  }

  function clearPending(state: ClientState, messageId: string): void {
    const timer = state.pending.get(messageId);
    if (timer) clearTimeout(timer);
    state.pending.delete(messageId);
  }

  function eventMessage(event: RealtimeStoredEvent, replayed: boolean): RealtimeEventMessage {
    return {
      type: "event",
      event: event.eventType,
      eventId: event.id,
      messageId: event.messageId,
      schema: { id: event.schemaId, slug: event.schemaSlug },
      entry: event.entry,
      occurredAt: event.occurredAt,
      delivery: { ackRequired: true, ackTimeoutMs },
      ...(replayed ? { replayed: true as const } : {}),
    };
  }

  return { attach, publish, retentionEventsPerSchema, snapshot };

  function pruneHistory(schemaId: string): void {
    try {
      pruneRealtimeEvents(database, schemaId, retentionEventsPerSchema);
    } catch {
      // Retention cleanup must not make content writes fail.
    }
  }
}

function closeWithError(ws: WebSocket, error: string): void {
  send(ws, { type: "error", error });
  ws.close(1008, error);
}

function send(ws: WebSocket, payload: unknown): void {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
}

function parseClientMessage(text: string): { type?: string; messageId?: unknown } | undefined {
  try {
    return JSON.parse(text) as { type?: string; messageId?: unknown };
  } catch {
    return undefined;
  }
}

function parseReplayLimit(value: string | null): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 50;
}
