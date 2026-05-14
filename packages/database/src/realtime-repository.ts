import { randomUUID } from "node:crypto";
import type { ApiagexDatabase } from "./database-adapter.type.js";
import type {
  RealtimeConfigRecord,
  RealtimeEventRecord,
  RealtimeEventType,
  RecordRealtimeEventInput,
  SetRealtimeConfigInput,
} from "./realtime-repository.type.js";
import { getSchemaById, listSchemas } from "./schema-repository.js";

const allowedEvents = new Set<RealtimeEventType>(["entry.created", "entry.updated", "entry.deleted"]);

type RealtimeConfigRow = Omit<RealtimeConfigRecord, "enabled" | "events"> & {
  enabled: number;
  eventsJson: string;
};

type RealtimeEventRow = Omit<RealtimeEventRecord, "entry" | "eventType"> & {
  eventType: RealtimeEventType;
  entryJson: string;
  sequence: number;
};

export async function listRealtimeConfigs(db: ApiagexDatabase): Promise<RealtimeConfigRecord[]> {
  const rows = await db.prepare(realtimeSelectSql("ORDER BY updated_at DESC")).all<RealtimeConfigRow>();
  return rows.map(rowToRealtimeConfig);
}

export async function listRealtimeSettings(db: ApiagexDatabase): Promise<RealtimeConfigRecord[]> {
  const configs = new Map((await listRealtimeConfigs(db)).map((config) => [config.schemaId, config]));
  const now = new Date().toISOString();
  return (await listSchemas(db)).map((schema) =>
    configs.get(schema.id) ?? {
      schemaId: schema.id,
      enabled: false,
      events: ["entry.created", "entry.updated", "entry.deleted"],
      createdAt: now,
      updatedAt: now,
    },
  );
}

export async function getRealtimeConfig(
  db: ApiagexDatabase,
  schemaId: string,
): Promise<RealtimeConfigRecord | undefined> {
  const row = await db.prepare(realtimeSelectSql("WHERE schema_id = ?")).get<RealtimeConfigRow>(schemaId);
  return row ? rowToRealtimeConfig(row) : undefined;
}

export async function setRealtimeConfig(
  db: ApiagexDatabase,
  input: SetRealtimeConfigInput,
): Promise<RealtimeConfigRecord> {
  const events = normalizeEvents(input.events);
  if (!(await getSchemaById(db, input.schemaId))) throw new Error("SCHEMA_NOT_FOUND");
  const now = new Date().toISOString();
  await db.prepare(
    `INSERT INTO realtime_configs (schema_id, enabled, events_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(schema_id) DO UPDATE SET enabled = excluded.enabled,
       events_json = excluded.events_json,
       updated_at = excluded.updated_at`,
  ).run(input.schemaId, input.enabled ? 1 : 0, JSON.stringify(events), now, now);
  const config = await getRealtimeConfig(db, input.schemaId);
  if (!config) throw new Error("REALTIME_CONFIG_NOT_FOUND");
  return config;
}

export async function isRealtimeEventEnabled(
  db: ApiagexDatabase,
  schemaId: string,
  event: RealtimeEventType,
): Promise<boolean> {
  const config = await getRealtimeConfig(db, schemaId);
  return Boolean(config?.enabled && config.events.includes(event));
}

export async function recordRealtimeEvent(
  db: ApiagexDatabase,
  input: RecordRealtimeEventInput,
): Promise<RealtimeEventRecord> {
  const now = new Date().toISOString();
  const id = `rte_${randomUUID()}`;
  const messageId = `rtm_${randomUUID()}`;
  await db.prepare(
    `INSERT INTO realtime_events
      (id, message_id, event_type, schema_id, schema_slug, entry_id, entry_json, occurred_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, messageId, input.eventType, input.schemaId, input.schemaSlug, input.entry.id, JSON.stringify(input.entry), now, now);
  const row = await db.prepare(realtimeEventSelectSql("WHERE id = ?")).get<RealtimeEventRow>(id);
  if (!row) throw new Error("REALTIME_EVENT_NOT_FOUND");
  return rowToRealtimeEvent(row);
}

export async function listRealtimeEventsAfter(
  db: ApiagexDatabase,
  schemaId: string,
  lastEventId: string,
  limit = 50,
): Promise<RealtimeEventRecord[]> {
  const last = await db.prepare("SELECT sequence FROM realtime_events WHERE id = ? AND schema_id = ?")
    .get<{ sequence: number }>(lastEventId, schemaId);
  if (!last) return [];
  const rows = await db
    .prepare(realtimeEventSelectSql("WHERE schema_id = ? AND sequence > ? ORDER BY sequence ASC LIMIT ?"))
    .all<RealtimeEventRow>(schemaId, last.sequence, Math.max(1, Math.min(limit, 100)));
  return rows.map(rowToRealtimeEvent);
}

export async function listRecentRealtimeEvents(db: ApiagexDatabase, limit = 25): Promise<RealtimeEventRecord[]> {
  const rows = await db.prepare(realtimeEventSelectSql("ORDER BY sequence DESC LIMIT ?"))
    .all<RealtimeEventRow>(Math.max(1, Math.min(limit, 100)));
  return rows.map(rowToRealtimeEvent);
}

export async function pruneRealtimeEvents(db: ApiagexDatabase, schemaId: string, keepLatest = 1000): Promise<number> {
  const keep = Math.max(1, keepLatest);
  const result = await db.prepare(
    `DELETE FROM realtime_events
     WHERE schema_id = ?
       AND sequence NOT IN (
         SELECT sequence FROM realtime_events
         WHERE schema_id = ?
         ORDER BY sequence DESC
         LIMIT ?
       )`,
  ).run(schemaId, schemaId, keep);
  return result.changes;
}

function normalizeEvents(events: RealtimeEventType[]): RealtimeEventType[] {
  const unique = [...new Set(events)];
  if (unique.length === 0 || unique.some((event) => !allowedEvents.has(event))) {
    throw new Error("REALTIME_EVENTS_INVALID");
  }
  return unique;
}

function rowToRealtimeConfig(row: RealtimeConfigRow): RealtimeConfigRecord {
  const { eventsJson: _eventsJson, ...record } = row;
  return {
    ...record,
    enabled: Boolean(row.enabled),
    events: JSON.parse(row.eventsJson) as RealtimeEventType[],
  };
}

function realtimeSelectSql(suffix: string): string {
  return `SELECT schema_id as schemaId, enabled, events_json as eventsJson, created_at as createdAt, updated_at as updatedAt FROM realtime_configs ${suffix}`;
}

function rowToRealtimeEvent(row: RealtimeEventRow): RealtimeEventRecord {
  const { entryJson: _entryJson, sequence: _sequence, ...record } = row;
  return { ...record, entry: JSON.parse(row.entryJson) as RealtimeEventRecord["entry"] };
}

function realtimeEventSelectSql(suffix: string): string {
  return `SELECT sequence, id, message_id as messageId, event_type as eventType, schema_id as schemaId, schema_slug as schemaSlug, entry_id as entryId, entry_json as entryJson, occurred_at as occurredAt, created_at as createdAt FROM realtime_events ${suffix}`;
}
