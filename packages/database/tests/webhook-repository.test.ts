import { describe, expect, it } from "vitest";
import {
  createEntry,
  createSchema,
  createWebhook,
  deleteWebhook,
  enqueueWebhookEvent,
  listMatchingWebhooks,
  listPendingWebhookEvents,
  listWebhookDeliveries,
  listWebhooks,
  openMigratedSqliteAdapter,
  recordWebhookDelivery,
  updateWebhook,
  type ApiagexDatabase,
} from "../src/index.js";

describe("webhook repository", () => {
  it("creates, lists, updates, and deletes webhook registrations", async () => {
    const db = openMigratedSqliteAdapter();
    const schema = await createArticleSchema(db);

    const webhook = await createWebhook(db, {
      events: ["entry.created", "entry.updated"],
      name: "CRM sync",
      schemaId: schema.id,
      secret: "secret",
      url: "https://example.com/hook",
    });
    expect(webhook.active).toBe(true);
    expect(webhook.events).toEqual(["entry.created", "entry.updated"]);
    expect(await listWebhooks(db)).toHaveLength(1);

    const updated = await updateWebhook(db, webhook.id, {
      active: false,
      events: ["entry.deleted"],
      name: "CRM delete sync",
      schemaId: null,
      url: "https://example.com/delete",
    });
    expect(updated.active).toBe(false);
    expect(updated.events).toEqual(["entry.deleted"]);
    expect(await deleteWebhook(db, webhook.id)).toBe(true);
    expect(await listWebhooks(db)).toHaveLength(0);
  });

  it("enqueues events and matches active webhook filters", async () => {
    const db = openMigratedSqliteAdapter();
    const schema = await createArticleSchema(db);
    const entry = await createEntry(db, { schemaId: schema.id, data: { title: "Hooked" } });
    await createWebhook(db, {
      events: ["entry.created"],
      name: "All create",
      url: "https://example.com/all",
    });
    await createWebhook(db, {
      events: ["entry.updated"],
      name: "Update only",
      url: "https://example.com/update",
    });

    const event = await enqueueWebhookEvent(db, {
      entry,
      eventType: "entry.created",
      schemaId: schema.id,
      schemaSlug: schema.slug,
    });

    expect(event.payload.entry.data.title).toBe("Hooked");
    expect(await listPendingWebhookEvents(db)).toHaveLength(1);
    expect((await listMatchingWebhooks(db, event)).map((webhook) => webhook.name)).toEqual(["All create"]);
  });

  it("records delivery attempts without exposing webhook secrets", async () => {
    const db = openMigratedSqliteAdapter();
    const schema = await createArticleSchema(db);
    const entry = await createEntry(db, { schemaId: schema.id, data: { title: "Delivery" } });
    const webhook = await createWebhook(db, {
      events: ["entry.created"],
      name: "Receiver",
      secret: "hidden",
      url: "https://example.com/hook",
    });
    const event = await enqueueWebhookEvent(db, {
      entry,
      eventType: "entry.created",
      schemaId: schema.id,
      schemaSlug: schema.slug,
    });

    await recordWebhookDelivery(db, {
      attempt: 1,
      eventId: event.id,
      responseBody: "ok",
      status: "success",
      statusCode: 200,
      url: webhook.url,
      webhookId: webhook.id,
    });

    expect(await listWebhookDeliveries(db, webhook.id)).toHaveLength(1);
    expect(JSON.stringify(await listWebhooks(db))).not.toContain("hidden");
  });
});

function createArticleSchema(db: ApiagexDatabase) {
  return createSchema(db, {
    fields: [{ name: "Title", slug: "title", type: "text", required: true }],
    name: "Article",
    slug: "article",
  });
}
