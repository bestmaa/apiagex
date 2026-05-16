import { openSqliteDatabase } from "@apiagex/database";
import { describe, expect, it } from "vitest";
import { createServer } from "../src/app.js";
import type { WebhookHttpRequest } from "../src/webhook-dispatcher.type.js";

describe("webhook admin APIs", () => {
  it("creates, lists, updates, deletes, and lists deliveries", async () => {
    const server = createServer({ adminAuth: "disabled", database: openSqliteDatabase() });
    const schemaId = await createArticleSchema(server);

    const create = await server.inject({
      method: "POST",
      url: "/api/admin/webhooks",
      payload: {
        events: ["entry.created", "entry.updated"],
        name: "CRM sync",
        schemaId,
        secret: "secret",
        url: "https://example.com/hook",
      },
    });
    expect(create.statusCode).toBe(200);
    expect(create.json().webhook.secret).toBeUndefined();
    const webhookId = create.json().webhook.id as string;

    const list = await server.inject({ method: "GET", url: "/api/admin/webhooks" });
    expect(list.json().webhooks).toHaveLength(1);

    const update = await server.inject({
      method: "PUT",
      url: `/api/admin/webhooks/${webhookId}`,
      payload: {
        active: false,
        events: ["entry.deleted"],
        name: "CRM delete",
        schemaId: null,
        url: "https://example.com/delete",
      },
    });
    expect(update.json().webhook.active).toBe(false);

    const deliveries = await server.inject({
      method: "GET",
      url: `/api/admin/webhooks/${webhookId}/deliveries`,
    });
    expect(deliveries.json()).toEqual({ ok: true, deliveries: [] });

    const remove = await server.inject({ method: "DELETE", url: `/api/admin/webhooks/${webhookId}` });
    expect(remove.json()).toEqual({ ok: true, deleted: true });
  });

  it("delivers dynamic content mutation hooks without failing writes", async () => {
    const calls: WebhookHttpRequest[] = [];
    const server = createServer({
      adminAuth: "disabled",
      database: openSqliteDatabase(),
      webhookHttpClient: async (request) => {
        calls.push(request);
        return { body: "accepted", statusCode: 202 };
      },
    });
    await createArticleSchema(server);
    const webhook = await server.inject({
      method: "POST",
      url: "/api/admin/webhooks",
      payload: {
        events: ["entry.created"],
        name: "Receiver",
        secret: "secret",
        url: "https://example.com/hook",
      },
    });

    const create = await server.inject({
      method: "POST",
      url: "/api/content/article",
      payload: { data: { title: "Webhook content" } },
    });
    const deliveries = await server.inject({
      method: "GET",
      url: `/api/admin/webhooks/${webhook.json().webhook.id}/deliveries`,
    });

    expect(create.statusCode).toBe(200);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.headers["x-apiagex-event"]).toBe("entry.created");
    expect(calls[0]?.headers["x-apiagex-delivery-id"]).toMatch(/^whd_/);
    expect(calls[0]?.headers["x-apiagex-timestamp"]).toBeTruthy();
    expect(JSON.parse(calls[0]?.body ?? "{}").entry.data.title).toBe("Webhook content");
    expect(deliveries.json().deliveries[0].status).toBe("success");
  });

  it("logs failed admin entry update hooks while the update succeeds", async () => {
    const server = createServer({
      adminAuth: "disabled",
      database: openSqliteDatabase(),
      webhookHttpClient: async () => ({ body: "down", statusCode: 503 }),
    });
    const schemaId = await createArticleSchema(server);
    const webhook = await server.inject({
      method: "POST",
      url: "/api/admin/webhooks",
      payload: {
        events: ["entry.updated"],
        name: "Receiver",
        url: "https://example.com/hook",
      },
    });
    const entry = await server.inject({
      method: "POST",
      url: `/api/admin/schemas/${schemaId}/entries`,
      payload: { data: { title: "Before" } },
    });

    const update = await server.inject({
      method: "PUT",
      url: `/api/admin/schemas/${schemaId}/entries/${entry.json().entry.id}`,
      payload: { data: { title: "After" } },
    });
    const deliveries = await server.inject({
      method: "GET",
      url: `/api/admin/webhooks/${webhook.json().webhook.id}/deliveries`,
    });

    expect(update.statusCode).toBe(200);
    expect(update.json().entry.data.title).toBe("After");
    expect(deliveries.json().deliveries[0].status).toBe("failed");
    expect(deliveries.json().deliveries[0].statusCode).toBe(503);
  });

  it("rejects invalid webhook URLs", async () => {
    const server = createServer({ adminAuth: "disabled", database: openSqliteDatabase() });

    const response = await server.inject({
      method: "POST",
      url: "/api/admin/webhooks",
      payload: { events: ["entry.created"], name: "Bad", url: "ftp://example.com/hook" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ ok: false, error: "WEBHOOK_URL_INVALID" });
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
