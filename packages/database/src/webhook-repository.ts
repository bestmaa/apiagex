import { randomUUID } from "node:crypto";
import type { ApiagexDatabase } from "./database-adapter.type.js";
import { getSchemaById } from "./schema-repository.js";
import type {
  EnqueueWebhookEventInput,
  RecordWebhookDeliveryInput,
  WebhookDeliveryRecord,
  WebhookDraft,
  WebhookEventRecord,
  WebhookEventStatus,
  WebhookEventType,
  WebhookPayload,
  WebhookRecord,
  WebhookSecretRecord,
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

export async function createWebhook(db: ApiagexDatabase, input: WebhookDraft): Promise<WebhookRecord> {
  const draft = await normalizeWebhookDraft(db, input);
  const id = randomUUID();
  const now = new Date().toISOString();
  await db.prepare(
    `INSERT INTO webhooks (id, name, url, secret, events_json, schema_id, active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, draft.name, draft.url, draft.secret, JSON.stringify(draft.events), draft.schemaId, draft.active ? 1 : 0, now, now);
  return publicWebhook(await requireWebhook(db, id));
}

export async function updateWebhook(
  db: ApiagexDatabase,
  webhookId: string,
  input: WebhookDraft,
): Promise<WebhookRecord> {
  const current = await requireWebhook(db, webhookId);
  const draft = await normalizeWebhookDraft(db, { ...input, secret: input.secret ?? current.secret });
  await db.prepare(
    `UPDATE webhooks SET name = ?, url = ?, secret = ?, events_json = ?, schema_id = ?, active = ?, updated_at = ?
     WHERE id = ?`,
  ).run(
    draft.name,
    draft.url,
    draft.secret,
    JSON.stringify(draft.events),
    draft.schemaId,
    draft.active ? 1 : 0,
    new Date().toISOString(),
    webhookId,
  );
  return publicWebhook(await requireWebhook(db, webhookId));
}

export async function listWebhooks(db: ApiagexDatabase): Promise<WebhookRecord[]> {
  const rows = await db.prepare(webhookSelectSql("ORDER BY created_at DESC")).all<WebhookRow>();
  return rows.map(rowToWebhook).map(publicWebhook);
}

export async function deleteWebhook(db: ApiagexDatabase, webhookId: string): Promise<boolean> {
  const result = await db.prepare("DELETE FROM webhooks WHERE id = ?").run(webhookId);
  return result.changes > 0;
}

export async function enqueueWebhookEvent(
  db: ApiagexDatabase,
  input: EnqueueWebhookEventInput,
): Promise<WebhookEventRecord> {
  const id = randomUUID();
  const now = new Date().toISOString();
  const payload: WebhookPayload = {
    event: input.eventType,
    schema: { id: input.schemaId, slug: input.schemaSlug },
    entry: input.entry,
    occurredAt: now,
  };
  await db.prepare(
    `INSERT INTO webhook_events
      (id, event_type, schema_id, schema_slug, entry_id, payload_json, status, attempts, next_retry_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', 0, NULL, ?, ?)`,
  ).run(id, input.eventType, input.schemaId, input.schemaSlug, input.entry.id, JSON.stringify(payload), now, now);
  return requireWebhookEvent(db, id);
}

export async function listPendingWebhookEvents(
  db: ApiagexDatabase,
  now = new Date().toISOString(),
  limit = 20,
): Promise<WebhookEventRecord[]> {
  const rows = await db
    .prepare(eventSelectSql("WHERE status = 'pending' AND (next_retry_at IS NULL OR next_retry_at <= ?) ORDER BY created_at ASC LIMIT ?"))
    .all<EventRow>(now, limit);
  return rows.map(rowToEvent);
}

export async function listMatchingWebhooks(
  db: ApiagexDatabase,
  event: WebhookEventRecord,
): Promise<WebhookSecretRecord[]> {
  const rows = await db
    .prepare(webhookSelectSql("WHERE active = 1 AND (schema_id IS NULL OR schema_id = ?) ORDER BY created_at ASC"))
    .all<WebhookRow>(event.schemaId);
  return rows.map(rowToWebhook).filter((webhook) => webhook.events.includes(event.eventType));
}

export async function listWebhookDeliveries(
  db: ApiagexDatabase,
  webhookId?: string,
): Promise<WebhookDeliveryRecord[]> {
  const suffix = webhookId ? "WHERE webhook_id = ? ORDER BY created_at DESC" : "ORDER BY created_at DESC";
  return webhookId
    ? db.prepare(deliverySelectSql(suffix)).all<DeliveryRow>(webhookId)
    : db.prepare(deliverySelectSql(suffix)).all<DeliveryRow>();
}

export async function countWebhookDeliveryAttempts(
  db: ApiagexDatabase,
  eventId: string,
  webhookId: string,
): Promise<number> {
  const row = await db
    .prepare("SELECT COUNT(*) as count FROM webhook_deliveries WHERE event_id = ? AND webhook_id = ?")
    .get<{ count: number }>(eventId, webhookId);
  return row?.count ?? 0;
}

export async function hasSuccessfulWebhookDelivery(
  db: ApiagexDatabase,
  eventId: string,
  webhookId: string,
): Promise<boolean> {
  const row = await db
    .prepare("SELECT id FROM webhook_deliveries WHERE event_id = ? AND webhook_id = ? AND status = 'success' LIMIT 1")
    .get<{ id: string }>(eventId, webhookId);
  return Boolean(row);
}

export async function recordWebhookDelivery(
  db: ApiagexDatabase,
  input: RecordWebhookDeliveryInput,
): Promise<WebhookDeliveryRecord> {
  const id = input.id ?? randomUUID();
  await db.prepare(
    `INSERT INTO webhook_deliveries
      (id, event_id, webhook_id, url, status, status_code, response_body, error, attempt, created_at, next_retry_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.eventId,
    input.webhookId,
    input.url,
    input.status,
    input.statusCode ?? null,
    trim(input.responseBody),
    trim(input.error),
    input.attempt,
    new Date().toISOString(),
    input.nextRetryAt ?? null,
  );
  const delivery = await db.prepare(deliverySelectSql("WHERE id = ?")).get<WebhookDeliveryRecord>(id);
  if (!delivery) throw new Error("WEBHOOK_DELIVERY_NOT_FOUND");
  return delivery;
}

export async function updateWebhookEventStatus(
  db: ApiagexDatabase,
  eventId: string,
  status: WebhookEventStatus,
  attempts: number,
  nextRetryAt: string | null,
): Promise<void> {
  await db.prepare("UPDATE webhook_events SET status = ?, attempts = ?, next_retry_at = ?, updated_at = ? WHERE id = ?")
    .run(status, attempts, nextRetryAt, new Date().toISOString(), eventId);
}

async function normalizeWebhookDraft(db: ApiagexDatabase, input: WebhookDraft): Promise<Required<WebhookDraft>> {
  const events = [...new Set(input.events)];
  if (!input.name.trim()) throw new Error("WEBHOOK_NAME_REQUIRED");
  if (!isHttpUrl(input.url)) throw new Error("WEBHOOK_URL_INVALID");
  if (events.length === 0 || events.some((event) => !allowedEvents.has(event))) throw new Error("WEBHOOK_EVENTS_INVALID");
  if (input.schemaId && !(await getSchemaById(db, input.schemaId))) throw new Error("SCHEMA_NOT_FOUND");
  const secret = input.secret?.trim() || randomUUID();
  return { name: input.name.trim(), url: input.url.trim(), secret, events, schemaId: input.schemaId ?? null, active: input.active ?? true };
}

async function requireWebhook(db: ApiagexDatabase, webhookId: string): Promise<WebhookSecretRecord> {
  const row = await db.prepare(webhookSelectSql("WHERE id = ?")).get<WebhookRow>(webhookId);
  if (!row) throw new Error("WEBHOOK_NOT_FOUND");
  return rowToWebhook(row);
}

async function requireWebhookEvent(db: ApiagexDatabase, eventId: string): Promise<WebhookEventRecord> {
  const row = await db.prepare(eventSelectSql("WHERE id = ?")).get<EventRow>(eventId);
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
