import type { AddressInfo } from "node:net";
import { openSqliteDatabase } from "@apiagex/database";
import { WebSocket } from "ws";
import { describe, expect, it } from "vitest";
import { createServer } from "../src/app.js";
import type { WebhookHttpRequest } from "../src/webhook-dispatcher.type.js";

describe("project feature audit", () => {
  it("verifies the current owner, API, RBAC, webhook, realtime, and docs flows", async () => {
    const webhookCalls: WebhookHttpRequest[] = [];
    const server = createServer({
      database: openSqliteDatabase(),
      webhookHttpClient: async (request) => {
        webhookCalls.push(request);
        return { body: "ok", statusCode: 202 };
      },
    });

    await expectOk(server.inject({ method: "GET", url: "/api" }));
    await expectOk(server.inject({ method: "GET", url: "/api/health" }));
    await expectStatus(server.inject({ method: "GET", url: "/adminui" }), 200);
    await expectStatus(server.inject({ method: "GET", url: "/doc" }), 200);
    await expectStatus(server.inject({ method: "GET", url: "/readme" }), 200);
    await expectStatus(server.inject({ method: "GET", url: "/favicon.ico" }), 204);

    await expectOk(server.inject({
      method: "POST",
      url: "/api/auth/bootstrap-owner",
      payload: { email: "owner@apiagex.local", password: "OwnerPass123!" },
    }));
    await expectStatus(server.inject({
      method: "POST",
      url: "/api/auth/bootstrap-owner",
      payload: { email: "second@apiagex.local", password: "OwnerPass123!" },
    }), 409);
    await expectOk(server.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: "owner@apiagex.local", password: "OwnerPass123!" },
    }));

    const authorSchema = await createSchema(server, {
      fields: [{ name: "Name", slug: "name", type: "text", required: true }],
      name: "Audit Author",
      slug: "audit-author",
    });
    const articleSchema = await createSchema(server, {
      fields: [
        { name: "Title", slug: "title", type: "text", required: true },
        { name: "Views", slug: "views", type: "number" },
        {
          name: "Author",
          slug: "author",
          type: "relation",
          relationSchemaId: authorSchema.id,
          relationType: "manyToOne",
          required: true,
        },
      ],
      name: "Audit Article",
      slug: "audit-article",
    });
    const author = await createContent(server, "audit-author", { name: "Audit Writer" });
    const alpha = await createContent(server, "audit-article", {
      author: author.id,
      title: "Alpha Launch",
      views: 10,
    });
    await createContent(server, "audit-article", { author: author.id, title: "Beta Draft", views: 20 });

    const filtered = await server.inject({
      method: "GET",
      url: "/api/content/audit-article?fields=title&search=Alpha&limit=1&offset=0",
    });
    expect(filtered.statusCode).toBe(200);
    expect(filtered.json()).toMatchObject({ limit: 1, offset: 0, total: 1 });
    expect(filtered.json().entries[0].data).toEqual({ title: "Alpha Launch" });

    const populated = await server.inject({
      method: "GET",
      url: `/api/content/audit-article/${alpha.id}?populate=relations`,
    });
    expect(populated.json().entry.data.author.data.name).toBe("Audit Writer");

    const readerRole = await createRole(server, "audit-reader");
    const blockedRole = await createRole(server, "audit-blocked");
    await setPermissions(server, readerRole.id, [
      { action: "getAll", allowed: true, schemaId: articleSchema.id },
      { action: "get", allowed: true, schemaId: articleSchema.id },
      { action: "get", allowed: true, schemaId: authorSchema.id },
    ]);
    await createUser(server, "audit-reader@apiagex.local", readerRole.id);
    const userLogin = await expectOk(server.inject({
      method: "POST",
      url: "/api/auth/login-user",
      payload: { email: "audit-reader@apiagex.local", password: "UserPass123!" },
    }));
    expect(userLogin.json().user.roleId).toBe(readerRole.id);

    const token = await createToken(server, readerRole.id, "Audit reader token");
    const blockedToken = await createToken(server, blockedRole.id, "Blocked token");
    await expectStatus(server.inject({
      headers: { authorization: `Bearer ${token.token}` },
      method: "GET",
      url: "/api/content/audit-article",
    }), 200);
    const blocked = await server.inject({
      headers: { authorization: `Bearer ${blockedToken.token}` },
      method: "GET",
      url: "/api/content/audit-article",
    });
    expect(blocked.statusCode).toBe(403);
    expect(blocked.json().error).toBe("API_PERMISSION_DENIED");

    const webhook = await expectOk(server.inject({
      method: "POST",
      url: "/api/admin/webhooks",
      payload: {
        events: ["entry.updated"],
        name: "Audit hook",
        schemaId: articleSchema.id,
        secret: "audit-secret",
        url: "https://example.com/audit",
      },
    }));
    await expectOk(server.inject({
      method: "PUT",
      payload: { data: { author: author.id, title: "Alpha Updated", views: 11 } },
      url: `/api/content/audit-article/${alpha.id}`,
    }));
    const deliveries = await expectOk(server.inject({
      method: "GET",
      url: `/api/admin/webhooks/${webhook.json().webhook.id}/deliveries`,
    }));
    expect(webhookCalls[0]?.headers["x-apiagex-signature"]).toMatch(/^sha256=/);
    expect(deliveries.json().deliveries[0]).toMatchObject({ status: "success", statusCode: 202 });

    await expectOk(server.inject({
      method: "PUT",
      payload: { enabled: true, events: ["entry.created"] },
      url: `/api/admin/realtime/${articleSchema.id}`,
    }));
    const session = await expectOk(server.inject({
      headers: { authorization: `Bearer ${token.token}` },
      method: "POST",
      payload: { schema: "audit-article", ttlSeconds: 60 },
      url: "/api/realtime/session",
    }));
    await server.listen({ host: "127.0.0.1", port: 0 });
    const port = (server.server.address() as AddressInfo).port;
    const socket = new WebSocket(`ws://127.0.0.1:${port}/api/realtime?schema=audit-article&session=${session.json().token}`);
    expect(await nextJson(socket)).toMatchObject({ type: "ready" });
    const eventPromise = nextJson(socket);
    await createContent(server, "audit-article", { author: author.id, title: "Realtime Audit", views: 30 });
    const realtimeEvent = await eventPromise;
    expect(realtimeEvent).toMatchObject({ event: "entry.created", type: "event" });
    socket.send(JSON.stringify({ messageId: realtimeEvent.messageId, type: "ack" }));
    expect(await nextJson(socket)).toMatchObject({ messageId: realtimeEvent.messageId, type: "ack.ok" });
    socket.close();

    const history = await expectOk(server.inject({ method: "GET", url: "/api/admin/realtime" }));
    expect(history.json().events[0]).toMatchObject({ eventType: "entry.created", schemaSlug: "audit-article" });
    await server.close();
  });
});

async function createSchema(server: ReturnType<typeof createServer>, payload: Record<string, unknown>) {
  const response = await expectOk(server.inject({ method: "POST", payload, url: "/api/admin/schemas" }));
  return response.json().schema as { id: string };
}

async function createContent(server: ReturnType<typeof createServer>, slug: string, data: Record<string, unknown>) {
  const response = await expectOk(server.inject({ method: "POST", payload: { data }, url: `/api/content/${slug}` }));
  return response.json().entry as { id: string };
}

async function createRole(server: ReturnType<typeof createServer>, name: string) {
  const response = await expectOk(server.inject({ method: "POST", payload: { name }, url: "/api/admin/roles" }));
  return response.json().role as { id: string };
}

async function setPermissions(server: ReturnType<typeof createServer>, roleId: string, permissions: Array<Record<string, unknown>>) {
  await expectOk(server.inject({ method: "PUT", payload: { permissions }, url: `/api/admin/roles/${roleId}/permissions` }));
}

async function createUser(server: ReturnType<typeof createServer>, email: string, roleId: string) {
  await expectOk(server.inject({
    method: "POST",
    payload: { email, password: "UserPass123!", roleId },
    url: "/api/admin/users",
  }));
}

async function createToken(server: ReturnType<typeof createServer>, roleId: string, name: string) {
  const response = await expectOk(server.inject({ method: "POST", payload: { name }, url: `/api/admin/roles/${roleId}/tokens` }));
  return response.json() as { token: string };
}

async function expectOk(responsePromise: Promise<{ statusCode: number; json: () => any }>) {
  const response = await responsePromise;
  expect(response.statusCode).toBe(200);
  return response;
}

async function expectStatus(responsePromise: Promise<{ statusCode: number }>, statusCode: number) {
  const response = await responsePromise;
  expect(response.statusCode).toBe(statusCode);
  return response;
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
