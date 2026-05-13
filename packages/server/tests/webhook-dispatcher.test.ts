import { createHmac } from "node:crypto";
import {
  createEntry,
  createSchema,
  createWebhook,
  enqueueWebhookEvent,
  listPendingWebhookEvents,
  listWebhookDeliveries,
  migrateMvpDatabase,
  openSqliteDatabase,
} from "apiagex-database";
import { describe, expect, it } from "vitest";
import { dispatchPendingWebhooks, signWebhookRequest, verifyWebhookSignature } from "../src/webhook-dispatcher.js";
import type { WebhookHttpRequest } from "../src/webhook-dispatcher.type.js";

describe("webhook dispatcher", () => {
  it("signs and delivers pending webhook events", async () => {
    const db = openMigratedDb();
    const schema = createArticleSchema(db);
    const entry = createEntry(db, { schemaId: schema.id, data: { title: "Delivered" } });
    const webhook = createWebhook(db, {
      events: ["entry.created"],
      name: "Receiver",
      secret: "hook-secret",
      url: "https://example.com/hook",
    });
    enqueueWebhookEvent(db, { entry, eventType: "entry.created", schemaId: schema.id, schemaSlug: schema.slug });
    const calls: WebhookHttpRequest[] = [];

    const results = await dispatchPendingWebhooks(db, {
      httpClient: async (request) => {
        calls.push(request);
        return { body: "ok", statusCode: 200 };
      },
    });

    const timestamp = calls[0]?.headers["x-apiagex-timestamp"] ?? "";
    const deliveryId = calls[0]?.headers["x-apiagex-delivery-id"] ?? "";
    const expectedSignature = createHmac("sha256", "hook-secret")
      .update(`${timestamp}.${deliveryId}.${calls[0]?.body ?? ""}`)
      .digest("hex");
    expect(results[0]?.delivered).toBe(1);
    expect(calls[0]?.url).toBe("https://example.com/hook");
    expect(calls[0]?.headers["x-apiagex-event"]).toBe("entry.created");
    expect(calls[0]?.headers["x-apiagex-delivery-id"]).toMatch(/^whd_/);
    expect(calls[0]?.headers["x-apiagex-timestamp"]).toBeTruthy();
    expect(calls[0]?.headers["x-apiagex-signature"]).toBe(`sha256=${expectedSignature}`);
    expect(listWebhookDeliveries(db, webhook.id)[0]?.id).toBe(deliveryId);
    expect(listWebhookDeliveries(db, webhook.id)[0]?.status).toBe("success");
    expect(listPendingWebhookEvents(db)).toHaveLength(0);
  });

  it("logs failed deliveries and leaves events pending for retry", async () => {
    const db = openMigratedDb();
    const schema = createArticleSchema(db);
    const entry = createEntry(db, { schemaId: schema.id, data: { title: "Retry" } });
    const webhook = createWebhook(db, {
      events: ["entry.updated"],
      name: "Receiver",
      url: "https://example.com/hook",
    });
    const event = enqueueWebhookEvent(db, { entry, eventType: "entry.updated", schemaId: schema.id, schemaSlug: schema.slug });
    const now = new Date("2026-05-11T00:00:00.000Z");

    await dispatchPendingWebhooks(db, {
      httpClient: async () => ({ body: "fail", statusCode: 500 }),
      now,
    });

    const delivery = listWebhookDeliveries(db, webhook.id)[0];
    const pending = listPendingWebhookEvents(db, "2026-05-11T00:00:59.000Z");
    const retryReady = listPendingWebhookEvents(db, "2026-05-11T00:01:01.000Z");
    expect(delivery?.status).toBe("failed");
    expect(delivery?.nextRetryAt).toBe("2026-05-11T00:01:00.000Z");
    expect(pending).toHaveLength(0);
    expect(retryReady.map((item) => item.id)).toEqual([event.id]);
  });

  it("can sign a request without dispatching it", () => {
    const db = openMigratedDb();
    const schema = createArticleSchema(db);
    const entry = createEntry(db, { schemaId: schema.id, data: { title: "Signed" } });
    const webhook = createWebhook(db, {
      events: ["entry.created"],
      name: "Receiver",
      secret: "manual-secret",
      url: "https://example.com/hook",
    });
    const event = enqueueWebhookEvent(db, { entry, eventType: "entry.created", schemaId: schema.id, schemaSlug: schema.slug });

    const signed = signWebhookRequest(
      event,
      { ...webhook, secret: "manual-secret" },
      "whd_manual",
      "2026-05-11T00:00:00.000Z",
    );

    expect(signed.headers["x-apiagex-signature"]).toMatch(/^sha256=/);
    expect(signed.headers["x-apiagex-delivery-id"]).toBe("whd_manual");
    expect(signed.headers["x-apiagex-timestamp"]).toBe("2026-05-11T00:00:00.000Z");
    expect(JSON.parse(signed.body).entry.data.title).toBe("Signed");
  });

  it("verifies timestamped webhook signatures and rejects replays outside tolerance", () => {
    const db = openMigratedDb();
    const schema = createArticleSchema(db);
    const entry = createEntry(db, { schemaId: schema.id, data: { title: "Verify" } });
    const webhook = createWebhook(db, {
      events: ["entry.created"],
      name: "Receiver",
      secret: "verify-secret",
      url: "https://example.com/hook",
    });
    const event = enqueueWebhookEvent(db, { entry, eventType: "entry.created", schemaId: schema.id, schemaSlug: schema.slug });
    const signed = signWebhookRequest(event, { ...webhook, secret: "verify-secret" }, "whd_verify", "2026-05-11T00:00:00.000Z");

    expect(verifyWebhookSignature({
      body: signed.body,
      deliveryId: "whd_verify",
      secret: "verify-secret",
      signature: signed.headers["x-apiagex-signature"] ?? "",
      timestamp: "2026-05-11T00:00:00.000Z",
      now: new Date("2026-05-11T00:04:00.000Z"),
    })).toBe(true);
    expect(verifyWebhookSignature({
      body: signed.body.replace("Verify", "Fake"),
      deliveryId: "whd_verify",
      secret: "verify-secret",
      signature: signed.headers["x-apiagex-signature"] ?? "",
      timestamp: "2026-05-11T00:00:00.000Z",
      now: new Date("2026-05-11T00:04:00.000Z"),
    })).toBe(false);
    expect(verifyWebhookSignature({
      body: signed.body,
      deliveryId: "whd_verify",
      secret: "verify-secret",
      signature: signed.headers["x-apiagex-signature"] ?? "",
      timestamp: "2026-05-11T00:00:00.000Z",
      now: new Date("2026-05-11T00:06:00.000Z"),
    })).toBe(false);
  });
});

function openMigratedDb() {
  const db = openSqliteDatabase();
  migrateMvpDatabase(db);
  return db;
}

function createArticleSchema(db: ReturnType<typeof openSqliteDatabase>) {
  return createSchema(db, {
    fields: [{ name: "Title", slug: "title", type: "text", required: true }],
    name: "Article",
    slug: "article",
  });
}
