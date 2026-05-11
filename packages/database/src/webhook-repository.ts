import { randomUUID } from "node:crypto";
import type { SqliteDatabase } from "./sqlite.js";
import { getSchemaById } from "./schema-repository.js";
import type {
  EnqueueWebhookEventInput,
  RecordWebhookDeliveryInput,
  WebhookDeliveryRecord,
  WebhookDraft,
  WebhookEventRecord,
  WebhookEventStatus,
  WebhookEventType,
  WebhookRecord,
  WebhookSecretRecord,
  WebhookPayload,
} from "./webhook-repository.type.js";

const allowedEvents = new Set<WebhookEventType>(["entry.created", "entry.updated", "entry.deleted"]);

type WebhookRow = Omit<WebhookSecretRecord, "active" | "events"> & {
  active: number;
  eventsJson: string;
};

type EventRow = Omit<WebhookEventRecord, "eventType" | "payload"> & {
  eventType: WebhookEventType;
  payloadJson: string;
};

type DeliveryRow = WebhookDeliveryRecord;

export function createWebhook(db: SqliteDatabase, input: WebhookDraft): WebhookRecord {
  const draft = normalizeWebhookDraft(db, input);
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO webhooks (id, name, url, secret, events_json, schema_id, active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, draft.name, draft.url, draft.secret, JSON.stringify(draft.events), draft.schemaId, draft.active ? 1 : 0, now, now);
  return publicWebhook(requireWebhook(db, id));
}

export function updateWebhook(db: SqliteDatabase, webhookId: string, input: WebhookDraft): WebhookRecord {
  const current = requireWebhook(db, webhookId);
  const draft = normalizeWebhookDraft(db, { ...input, secret: input.secret ?? current.secret });
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE webhooks SET name = ?, url = ?, secret = ?, events_json = ?, schema_id = ?, active = ?, updated_at = ?
     WHERE id = ?`,
  ).run(draft.name, draft.url, draft.secret, JSON.stringify(draft.events), draft.schemaId, draft.active ? 1 : 0, now, webhookId);
  return publicWebhook(requireWebhook(db, webhookId));
}

export function listWebhooks(db: SqliteDatabase): WebhookRecord[] {
  const rows = db.prepare(webhookSelectSql("ORDER BY created_at DESC")).all() as WebhookRow[];
  return rows.map(rowToWebhook).map(publicWebhook);
}

export function deleteWebhook(db: SqliteDatabase, webhookId: string): boolean {
  const result = db.prepare("DELETE FROM webhooks WHERE id = ?").run(webhookId);
  return result.changes > 0;
}

export function enqueueWebhookEvent(db: SqliteDatabase, input: EnqueueWebhookEventInput): WebhookEventRecord {
  const id = randomUUID();
  const now = new Date().toISOString();
  const payload: WebhookPayload = {
    event: input.eventType,
    schema: { id: input.schemaId, slug: input.schemaSlug },
    entry: input.entry,
    occurredAt: now,
  };
  db.prepare(
    `INSERT INTO webhook_events
      (id, event_type, schema_id, schema_slug, entry_id, payload_json, status, attempts, next_retry_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', 0, NULL, ?, ?)`,
  ).run(id, input.eventType, input.schemaId, input.schemaSlug, input.entry.id, JSON.stringify(payload), now, now);
  return requireWebhookEvent(db, id);
}

export function listPendingWebhookEvents(db: SqliteDatabase, now = new Date().toISOString(), limit = 20): WebhookEventRecord[] {
  const rows = db.prepare(eventSelectSql("WHERE status = 'pending' AND (next_retry_at IS NULL OR next_retry_at <= ?) ORDER BY created_at ASC LIMIT ?"))
    .all(now, limit) as EventRow[];
  return rows.map(rowToEvent);
}

export function listMatchingWebhooks(db: SqliteDatabase, event: WebhookEventRecord): WebhookSecretRecord[] {
  const rows = db.prepare(webhookSelectSql("WHERE active = 1 AND (schema_id IS NULL OR schema_id = ?) ORDER BY created_at ASC"))
    .all(event.schemaId) as WebhookRow[];
  return rows.map(rowToWebhook).filter((webhook) => webhook.events.includes(event.eventType));
}

export function listWebhookDeliveries(db: SqliteDatabase, webhookId?: string): WebhookDeliveryRecord[] {
  const suffix = webhookId ? "WHERE webhook_id = ? ORDER BY created_at DESC" : "ORDER BY created_at DESC";
  const rows = webhookId
    ? db.prepare(deliverySelectSql(suffix)).all(webhookId) as DeliveryRow[]
    : db.prepare(deliverySelectSql(suffix)).all() as DeliveryRow[];
  return rows;
}

export function countWebhookDeliveryAttempts(db: SqliteDatabase, eventId: string, webhookId: string): number {
  const row = db.prepare("SELECT COUNT(*) as count FROM webhook_deliveries WHERE event_id = ? AND webhook_id = ?")
    .get(eventId, webhookId) as { count: number };
  return row.count;
}

export function hasSuccessfulWebhookDelivery(db: SqliteDatabase, eventId: string, webhookId: string): boolean {
  const row = db.prepare("SELECT id FROM webhook_deliveries WHERE event_id = ? AND webhook_id = ? AND status = 'success' LIMIT 1")
    .get(eventId, webhookId);
  return Boolean(row);
}

export function recordWebhookDelivery(db: SqliteDatabase, input: RecordWebhookDeliveryInput): WebhookDeliveryRecord {
  const id = input.id ?? randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO webhook_deliveries
      (id, event_id, webhook_id, url, status, status_code, response_body, error, attempt, created_at, next_retry_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, input.eventId, input.webhookId, input.url, input.status, input.statusCode ?? null, trim(input.responseBody), trim(input.error), input.attempt, now, input.nextRetryAt ?? null);
  return db.prepare(deliverySelectSql("WHERE id = ?")).get(id) as WebhookDeliveryRecord;
}

export function updateWebhookEventStatus(
  db: SqliteDatabase,
  eventId: string,
  status: WebhookEventStatus,
  attempts: number,
  nextRetryAt: string | null,
): void {
  db.prepare("UPDATE webhook_events SET status = ?, attempts = ?, next_retry_at = ?, updated_at = ? WHERE id = ?")
    .run(status, attempts, nextRetryAt, new Date().toISOString(), eventId);
}

function normalizeWebhookDraft(db: SqliteDatabase, input: WebhookDraft): Required<WebhookDraft> {
  const events = [...new Set(input.events)];
  if (!input.name.trim()) throw new Error("WEBHOOK_NAME_REQUIRED");
  if (!isHttpUrl(input.url)) throw new Error("WEBHOOK_URL_INVALID");
  if (events.length === 0 || events.some((event) => !allowedEvents.has(event))) throw new Error("WEBHOOK_EVENTS_INVALID");
  if (input.schemaId && !getSchemaById(db, input.schemaId)) throw new Error("SCHEMA_NOT_FOUND");
  const secret = input.secret?.trim() || randomUUID();
  return { name: input.name.trim(), url: input.url.trim(), secret, events, schemaId: input.schemaId ?? null, active: input.active ?? true };
}

function requireWebhook(db: SqliteDatabase, webhookId: string): WebhookSecretRecord {
  const row = db.prepare(webhookSelectSql("WHERE id = ?")).get(webhookId) as WebhookRow | undefined;
  if (!row) throw new Error("WEBHOOK_NOT_FOUND");
  return rowToWebhook(row);
}

function requireWebhookEvent(db: SqliteDatabase, eventId: string): WebhookEventRecord {
  const row = db.prepare(eventSelectSql("WHERE id = ?")).get(eventId) as EventRow | undefined;
  if (!row) throw new Error("WEBHOOK_EVENT_NOT_FOUND");
  return rowToEvent(row);
}

function rowToWebhook(row: WebhookRow): WebhookSecretRecord {
  return { ...row, active: Boolean(row.active), events: JSON.parse(row.eventsJson) as WebhookEventType[] };
}

function rowToEvent(row: EventRow): WebhookEventRecord {
  return { ...row, payload: JSON.parse(row.payloadJson) as WebhookPayload };
}

function publicWebhook(webhook: WebhookSecretRecord): WebhookRecord {
  const { secret: _secret, ...record } = webhook;
  return record;
}

function isHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function trim(value: string | null | undefined): string | null {
  return value ? value.slice(0, 500) : null;
}

function webhookSelectSql(suffix: string): string {
  return `SELECT id, name, url, secret, events_json as eventsJson, schema_id as schemaId, active, created_at as createdAt, updated_at as updatedAt FROM webhooks ${suffix}`;
}

function eventSelectSql(suffix: string): string {
  return `SELECT id, event_type as eventType, schema_id as schemaId, schema_slug as schemaSlug, entry_id as entryId, payload_json as payloadJson, status, attempts, next_retry_at as nextRetryAt, created_at as createdAt, updated_at as updatedAt FROM webhook_events ${suffix}`;
}

function deliverySelectSql(suffix: string): string {
  return `SELECT id, event_id as eventId, webhook_id as webhookId, url, status, status_code as statusCode, response_body as responseBody, error, attempt, created_at as createdAt, next_retry_at as nextRetryAt FROM webhook_deliveries ${suffix}`;
}
