import type { AddressInfo } from "node:net";
import { createEntry, createSchema, openSqliteDatabase, pruneRealtimeEvents, recordRealtimeEvent } from "@apiagex/database";
import { WebSocket } from "ws";
import { describe, expect, it } from "vitest";
import { createServer } from "../src/app.js";

describe("realtime WebSocket APIs", () => {
  it("enables realtime per schema and publishes entry events with ack", async () => {
    const server = createServer({ database: openSqliteDatabase() });
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
    const database = openSqliteDatabase();
    const server = createServer({ database });
    const schema = createSchema(database, {
      fields: [{ name: "Title", slug: "title", type: "text" }],
      name: "Article",
      slug: "article",
    });
    for (let index = 0; index < 1005; index += 1) {
      const entry = createEntry(database, {
        data: { title: `Event ${index}` },
        schemaId: schema.id,
      });
      recordRealtimeEvent(database, { entry, eventType: "entry.created", schemaId: schema.id, schemaSlug: schema.slug });
    }
    pruneRealtimeEvents(database, schema.id, 1000);

    const rows = database.prepare("SELECT COUNT(*) as count FROM realtime_events WHERE schema_id = ?")
      .get(schema.id) as { count: number };
    const history = await server.inject({ method: "GET", url: "/api/admin/realtime" });

    expect(rows.count).toBe(1000);
    expect(history.json().events[0].entry.data.title).toBe("Event 1004");
  });

  it("replays missed schema events after lastEventId on reconnect", async () => {
    const server = createServer({ database: openSqliteDatabase() });
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
    const server = createServer({ database: openSqliteDatabase() });
    const schemaId = await createArticleSchema(server);
    await server.listen({ host: "127.0.0.1", port: 0 });

    const disabled = new WebSocket(`ws://127.0.0.1:${portOf(server)}/api/realtime?schema=article`);
    expect(await nextJson(disabled)).toMatchObject({ type: "error", error: "REALTIME_DISABLED" });

    await server.inject({
      method: "PUT",
      url: `/api/admin/realtime/${schemaId}`,
      payload: { enabled: true, events: ["entry.created"] },
    });
    const role = await server.inject({
      method: "POST",
      url: "/api/admin/roles",
      payload: { name: "blocked-realtime", description: "" },
    });
    const blocked = new WebSocket(`ws://127.0.0.1:${portOf(server)}/api/realtime?schema=article&roleId=${role.json().role.id}`);
    expect(await nextJson(blocked)).toMatchObject({ type: "error", error: "API_PERMISSION_DENIED" });
    await server.close();
  });
});

async function createArticleSchema(server: ReturnType<typeof createServer>): Promise<string> {
  const response = await server.inject({
    method: "POST",
    url: "/api/admin/schemas",
    payload: {
      fields: [{ name: "Title", slug: "title", type: "text", required: true }],
      name: "Article",
      slug: "article",
    },
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

function waitForMessage(
  messages: Array<Record<string, any>>,
  predicate: (message: Record<string, any>) => boolean,
): Promise<Record<string, any>> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const timer = setInterval(() => {
      const found = messages.find(predicate);
      if (found) {
        clearInterval(timer);
        resolve(found);
      }
      if (Date.now() - start > 3000) {
        clearInterval(timer);
        reject(new Error("WEBSOCKET_TIMEOUT"));
      }
    }, 10);
  });
}
