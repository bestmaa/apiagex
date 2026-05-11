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
  migrateMvpDatabase,
  openSqliteDatabase,
  recordWebhookDelivery,
  updateWebhook,
} from "../src/index.js";

describe("webhook repository", () => {
  it("creates, lists, updates, and deletes webhook registrations", () => {
    const db = openMigratedDb();
    const schema = createArticleSchema(db);

    const webhook = createWebhook(db, {
      events: ["entry.created", "entry.updated"],
      name: "CRM sync",
      schemaId: schema.id,
      secret: "secret",
      url: "https://example.com/hook",
    });
    expect(webhook.active).toBe(true);
    expect(webhook.events).toEqual(["entry.created", "entry.updated"]);
    expect(listWebhooks(db)).toHaveLength(1);

    const updated = updateWebhook(db, webhook.id, {
      active: false,
      events: ["entry.deleted"],
      name: "CRM delete sync",
      schemaId: null,
      url: "https://example.com/delete",
    });
    expect(updated.active).toBe(false);
    expect(updated.events).toEqual(["entry.deleted"]);
    expect(deleteWebhook(db, webhook.id)).toBe(true);
    expect(listWebhooks(db)).toHaveLength(0);
  });

  it("enqueues events and matches active webhook filters", () => {
    const db = openMigratedDb();
    const schema = createArticleSchema(db);
    const entry = createEntry(db, { schemaId: schema.id, data: { title: "Hooked" } });
    createWebhook(db, {
      events: ["entry.created"],
      name: "All create",
      url: "https://example.com/all",
    });
    createWebhook(db, {
      events: ["entry.updated"],
      name: "Update only",
      url: "https://example.com/update",
    });

    const event = enqueueWebhookEvent(db, {
      entry,
      eventType: "entry.created",
      schemaId: schema.id,
      schemaSlug: schema.slug,
    });

    expect(event.payload.entry.data.title).toBe("Hooked");
    expect(listPendingWebhookEvents(db)).toHaveLength(1);
    expect(listMatchingWebhooks(db, event).map((webhook) => webhook.name)).toEqual(["All create"]);
  });

  it("records delivery attempts without exposing webhook secrets", () => {
    const db = openMigratedDb();
    const schema = createArticleSchema(db);
    const entry = createEntry(db, { schemaId: schema.id, data: { title: "Delivery" } });
    const webhook = createWebhook(db, {
      events: ["entry.created"],
      name: "Receiver",
      secret: "hidden",
      url: "https://example.com/hook",
    });
    const event = enqueueWebhookEvent(db, {
      entry,
      eventType: "entry.created",
      schemaId: schema.id,
      schemaSlug: schema.slug,
    });

    recordWebhookDelivery(db, {
      attempt: 1,
      eventId: event.id,
      responseBody: "ok",
      status: "success",
      statusCode: 200,
      url: webhook.url,
      webhookId: webhook.id,
    });

    expect(listWebhookDeliveries(db, webhook.id)).toHaveLength(1);
    expect(JSON.stringify(listWebhooks(db))).not.toContain("hidden");
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
