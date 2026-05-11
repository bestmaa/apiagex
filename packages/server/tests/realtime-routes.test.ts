import type { AddressInfo } from "node:net";
import { openSqliteDatabase } from "@apiagex/database";
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

    const create = await server.inject({
      method: "POST",
      url: "/api/content/article",
      payload: { data: { title: "Live order" } },
    });
    const event = await nextJson(ws);
    expect(create.statusCode).toBe(200);
    expect(event).toMatchObject({
      type: "event",
      event: "entry.created",
      schema: { id: schemaId, slug: "article" },
    });
    expect(event.messageId).toMatch(/^rtm_/);
    expect(event.entry.data.title).toBe("Live order");

    ws.send(JSON.stringify({ type: "ack", messageId: event.messageId }));
    expect(await nextJson(ws)).toMatchObject({ type: "ack.ok", messageId: event.messageId });
    ws.close();
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
