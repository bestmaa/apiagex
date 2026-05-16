import type { AddressInfo } from "node:net";
import {
  createEntry,
  createSchema,
  openMigratedSqliteAdapter,
  openSqliteDatabase,
  pruneRealtimeEvents,
  recordRealtimeEvent,
} from "@apiagex/database";
import { WebSocket } from "ws";
import { describe, expect, it } from "vitest";
import { createServer } from "../src/app.js";

describe("realtime WebSocket APIs", () => {
  it("enables realtime per schema and publishes entry events with ack", async () => {
    const server = createServer({ adminAuth: "disabled", database: openSqliteDatabase() });
    const schemaId = await createArticleSchema(server);
    const list = await server.inject({ method: "GET", url: "/api/admin/realtime" });
    expect(list.json().configs[0]).toMatchObject({ enabled: false, schemaId });

    const save = await server.inject({
      method: "PUT",
      url: `/api/admin/realtime/${schemaId}`,
      payload: { enabled: true, events: ["entry.created"] },
    });
    expect(save.json().config).toMatchObject({ enabled: true, events: ["entry.created"], schemaId });

    await server.listen({ host: "127.0.0.1", port: 0 });
    const ws = new WebSocket(`ws://127.0.0.1:${portOf(server)}/api/realtime?schema=article`);
    const ready = await nextJson(ws);
    expect(ready.type).toBe("ready");

    const eventPromise = nextJson(ws);
    const create = await server.inject({
      method: "POST",
      url: "/api/content/article",
      payload: { data: { title: "Live order" } },
    });
    const event = await eventPromise;
    const history = await server.inject({ method: "GET", url: "/api/admin/realtime" });
    expect(create.statusCode).toBe(200);
    expect(history.json().retention).toEqual({ eventsPerSchema: 1000 });
    expect(history.json().events[0]).toMatchObject({
      eventType: "entry.created",
      id: event.eventId,
      schemaSlug: "article",
    });
    expect(event).toMatchObject({
      type: "event",
      event: "entry.created",
      schema: { id: schemaId, slug: "article" },
    });
    expect(event.messageId).toMatch(/^rtm_/);
    expect(event.eventId).toMatch(/^rte_/);
    expect(event.entry.data.title).toBe("Live order");

    ws.send(JSON.stringify({ type: "ack", messageId: event.messageId }));
    expect(await nextJson(ws)).toMatchObject({ type: "ack.ok", messageId: event.messageId });
    ws.close();
    await server.close();
  });

  it("keeps only the latest realtime history rows per schema", async () => {
    const database = openMigratedSqliteAdapter();
    const server = createServer({ adminAuth: "disabled", database });
    const schema = await createSchema(database, { fields: [{ name: "Title", slug: "title", type: "text" }], name: "Article", slug: "article" });
    for (let index = 0; index < 1005; index += 1) {
      const entry = await createEntry(database, {
        data: { title: `Event ${index}` },
        schemaId: schema.id,
      });
      await recordRealtimeEvent(database, { entry, eventType: "entry.created", schemaId: schema.id, schemaSlug: schema.slug });
    }
    await pruneRealtimeEvents(database, schema.id, 1000);

    const rows = await database.prepare("SELECT COUNT(*) as count FROM realtime_events WHERE schema_id = ?")
      .get<{ count: number }>(schema.id);
    const history = await server.inject({ method: "GET", url: "/api/admin/realtime" });

    expect(rows?.count).toBe(1000);
    expect(history.json().events[0].entry.data.title).toBe("Event 1004");
  });

  it("replays missed schema events after lastEventId on reconnect", async () => {
    const database = openMigratedSqliteAdapter();
    const server = createServer({ adminAuth: "disabled", database });
    const schemaId = await createArticleSchema(server);
    await server.inject({
      method: "PUT",
      url: `/api/admin/realtime/${schemaId}`,
      payload: { enabled: true, events: ["entry.created"] },
    });
    await server.listen({ host: "127.0.0.1", port: 0 });
    const port = portOf(server);
    const firstSocket = new WebSocket(`ws://127.0.0.1:${port}/api/realtime?schema=article`);
    await nextJson(firstSocket);

    const firstEventPromise = nextJson(firstSocket);
    await server.inject({
      method: "POST",
      url: "/api/content/article",
      payload: { data: { title: "First" } },
    });
    const firstEvent = await firstEventPromise;
    firstSocket.close();

    await server.inject({
      method: "POST",
      url: "/api/content/article",
      payload: { data: { title: "Missed" } },
    });
    const replaySocket = new WebSocket(`ws://127.0.0.1:${port}/api/realtime?schema=article&lastEventId=${firstEvent.eventId}`);
    const replayMessages: Array<Record<string, any>> = [];
    replaySocket.on("message", (data) => replayMessages.push(JSON.parse(data.toString()) as Record<string, any>));
    await waitForMessage(replayMessages, (message) => message.type === "ready");
    const replayed = await waitForMessage(replayMessages, (message) => message.type === "event");

    expect(replayed).toMatchObject({
      type: "event",
      event: "entry.created",
      replayed: true,
      schema: { id: schemaId, slug: "article" },
    });
    expect(replayed.entry.data.title).toBe("Missed");
    expect(replayed.eventId).not.toBe(firstEvent.eventId);
    replaySocket.close();
    await server.close();
  });

  it("rejects disabled schemas and roles without getAll permission", async () => {
    const server = createServer({ adminAuth: "disabled", database: openSqliteDatabase() });
    const schemaId = await createArticleSchema(server);
    await server.listen({ host: "127.0.0.1", port: 0 });

    const disabled = new WebSocket(`ws://127.0.0.1:${portOf(server)}/api/realtime?schema=article`);
    expect(await nextJson(disabled)).toMatchObject({ type: "error", error: "REALTIME_DISABLED" });

    await server.inject({
      method: "PUT",
      url: `/api/admin/realtime/${schemaId}`,
      payload: { enabled: true, events: ["entry.created"] },
    });
    const role = await server.inject({ method: "POST", url: "/api/admin/roles", payload: { name: "blocked-realtime", description: "" } });
    const blocked = new WebSocket(`ws://127.0.0.1:${portOf(server)}/api/realtime?schema=article&roleId=${role.json().role.id}`);
    expect(await nextJson(blocked)).toMatchObject({ type: "error", error: "API_PERMISSION_DENIED" });
    await server.close();
  });

  it("creates one-time realtime sessions for websocket connections", async () => {
    const database = openSqliteDatabase();
    const server = createServer({ adminAuth: "disabled", database });
    const schemaId = await createArticleSchema(server);
    await server.inject({
      method: "PUT",
      url: `/api/admin/realtime/${schemaId}`,
      payload: { enabled: true, events: ["entry.created"] },
    });
    const role = await server.inject({ method: "POST", url: "/api/admin/roles", payload: { name: "session-reader" } });
    await server.inject({
      method: "PUT",
      url: `/api/admin/roles/${role.json().role.id}/permissions`,
      payload: { permissions: [{ action: "getAll", allowed: true, schemaId }] },
    });
    const token = await server.inject({ method: "POST", url: `/api/admin/roles/${role.json().role.id}/tokens`, payload: { name: "Realtime client" } });
    const session = await server.inject({
      method: "POST",
      url: "/api/realtime/session",
      headers: { authorization: `Bearer ${token.json().token}` },
      payload: { schema: "article", ttlSeconds: 60 },
    });
    expect(session.statusCode).toBe(200);
    expect(session.json().token).toMatch(/^rt_/);
    expect(session.json().tokenPrefix).toBe(session.json().token.slice(0, 12));

    await server.listen({ host: "127.0.0.1", port: 0 });
    const port = portOf(server);
    const ws = new WebSocket(`ws://127.0.0.1:${port}/api/realtime?schema=article&session=${session.json().token}`);
    expect(await nextJson(ws)).toMatchObject({ type: "ready" });
    const reused = new WebSocket(`ws://127.0.0.1:${port}/api/realtime?schema=article&session=${session.json().token}`);
    expect(await nextJson(reused)).toMatchObject({ type: "error", error: "REALTIME_SESSION_INVALID" });

    const expiredSession = await server.inject({ method: "POST", url: "/api/realtime/session", headers: { authorization: `Bearer ${token.json().token}` }, payload: { schema: "article", ttlSeconds: 60 } });
    await database.prepare("UPDATE realtime_sessions SET expires_at = ? WHERE token_prefix = ?")
      .run("2026-01-01T00:00:00.000Z", expiredSession.json().tokenPrefix);
    const expired = new WebSocket(`ws://127.0.0.1:${port}/api/realtime?schema=article&session=${expiredSession.json().token}`);
    expect(await nextJson(expired)).toMatchObject({ type: "error", error: "REALTIME_SESSION_INVALID" });
    ws.close();
    await server.close();
  });

  it("rejects realtime session creation without getAll permission", async () => {
    const server = createServer({ adminAuth: "disabled", database: openSqliteDatabase() });
    await createArticleSchema(server);
    const role = await server.inject({ method: "POST", url: "/api/admin/roles", payload: { name: "no-session" } });
    const token = await server.inject({ method: "POST", url: `/api/admin/roles/${role.json().role.id}/tokens`, payload: { name: "Blocked realtime client" } });

    const session = await server.inject({ method: "POST", url: "/api/realtime/session", headers: { authorization: `Bearer ${token.json().token}` }, payload: { schema: "article" } });

    expect(session.statusCode).toBe(403);
    expect(session.json()).toEqual({ ok: false, error: "API_PERMISSION_DENIED" });
  });
});

async function createArticleSchema(server: ReturnType<typeof createServer>): Promise<string> {
  const response = await server.inject({
    method: "POST",
    url: "/api/admin/schemas",
    payload: { fields: [{ name: "Title", slug: "title", type: "text", required: true }], name: "Article", slug: "article" },
  });
  return response.json().schema.id as string;
}

function portOf(server: ReturnType<typeof createServer>): number {
  return (server.server.address() as AddressInfo).port;
}

function nextJson(ws: WebSocket): Promise<Record<string, any>> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("WEBSOCKET_TIMEOUT")), 3000);
    ws.once("message", (data) => {
      clearTimeout(timer);
      resolve(JSON.parse(data.toString()) as Record<string, any>);
    });
    ws.once("error", reject);
  });
}

function waitForMessage(messages: Array<Record<string, any>>, predicate: (message: Record<string, any>) => boolean): Promise<Record<string, any>> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const timer = setInterval(() => {
      const found = messages.find(predicate);
      if (found) {
        clearInterval(timer);
        resolve(found);
      } else if (Date.now() - start > 3000) {
        clearInterval(timer);
        reject(new Error("WEBSOCKET_TIMEOUT"));
      }
    }, 10);
  });
}
