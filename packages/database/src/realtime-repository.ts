import { randomUUID } from "node:crypto";
import type { SqliteDatabase } from "./sqlite.js";
import { getSchemaById, listSchemas } from "./schema-repository.js";
import type {
  RealtimeEventRecord,
  RealtimeConfigRecord,
  RealtimeEventType,
  RecordRealtimeEventInput,
  SetRealtimeConfigInput,
} from "./realtime-repository.type.js";

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

export function listRealtimeConfigs(db: SqliteDatabase): RealtimeConfigRecord[] {
  const rows = db.prepare(realtimeSelectSql("ORDER BY updated_at DESC")).all() as RealtimeConfigRow[];
  return rows.map(rowToRealtimeConfig);
}

export function listRealtimeSettings(db: SqliteDatabase): RealtimeConfigRecord[] {
  const configs = new Map(listRealtimeConfigs(db).map((config) => [config.schemaId, config]));
  const now = new Date().toISOString();
  return listSchemas(db).map((schema) =>
    configs.get(schema.id) ?? {
      schemaId: schema.id,
      enabled: false,
      events: ["entry.created", "entry.updated", "entry.deleted"],
      createdAt: now,
      updatedAt: now,
    },
  );
}

export function getRealtimeConfig(db: SqliteDatabase, schemaId: string): RealtimeConfigRecord | undefined {
  const row = db.prepare(realtimeSelectSql("WHERE schema_id = ?")).get(schemaId) as RealtimeConfigRow | undefined;
  return row ? rowToRealtimeConfig(row) : undefined;
}

export function setRealtimeConfig(db: SqliteDatabase, input: SetRealtimeConfigInput): RealtimeConfigRecord {
  const events = normalizeEvents(input.events);
  if (!getSchemaById(db, input.schemaId)) throw new Error("SCHEMA_NOT_FOUND");
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO realtime_configs (schema_id, enabled, events_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(schema_id) DO UPDATE SET enabled = excluded.enabled,
       events_json = excluded.events_json,
       updated_at = excluded.updated_at`,
  ).run(input.schemaId, input.enabled ? 1 : 0, JSON.stringify(events), now, now);
  return getRealtimeConfig(db, input.schemaId) as RealtimeConfigRecord;
}

export function isRealtimeEventEnabled(db: SqliteDatabase, schemaId: string, event: RealtimeEventType): boolean {
  const config = getRealtimeConfig(db, schemaId);
  return Boolean(config?.enabled && config.events.includes(event));
}

export function recordRealtimeEvent(db: SqliteDatabase, input: RecordRealtimeEventInput): RealtimeEventRecord {
  const now = new Date().toISOString();
  const id = `rte_${randomUUID()}`;
  const messageId = `rtm_${randomUUID()}`;
  db.prepare(
    `INSERT INTO realtime_events
      (id, message_id, event_type, schema_id, schema_slug, entry_id, entry_json, occurred_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, messageId, input.eventType, input.schemaId, input.schemaSlug, input.entry.id, JSON.stringify(input.entry), now, now);
  return rowToRealtimeEvent(db.prepare(realtimeEventSelectSql("WHERE id = ?")).get(id) as RealtimeEventRow);
}

export function listRealtimeEventsAfter(
  db: SqliteDatabase,
  schemaId: string,
  lastEventId: string,
  limit = 50,
): RealtimeEventRecord[] {
  const last = db.prepare("SELECT sequence FROM realtime_events WHERE id = ? AND schema_id = ?")
    .get(lastEventId, schemaId) as { sequence: number } | undefined;
  if (!last) return [];
  const rows = db.prepare(realtimeEventSelectSql("WHERE schema_id = ? AND sequence > ? ORDER BY sequence ASC LIMIT ?"))
    .all(schemaId, last.sequence, Math.max(1, Math.min(limit, 100))) as RealtimeEventRow[];
  return rows.map(rowToRealtimeEvent);
}

export function listRecentRealtimeEvents(db: SqliteDatabase, limit = 25): RealtimeEventRecord[] {
  const rows = db.prepare(realtimeEventSelectSql("ORDER BY sequence DESC LIMIT ?"))
    .all(Math.max(1, Math.min(limit, 100))) as RealtimeEventRow[];
  return rows.map(rowToRealtimeEvent);
}

export function pruneRealtimeEvents(db: SqliteDatabase, schemaId: string, keepLatest = 1000): number {
  const keep = Math.max(1, keepLatest);
  const result = db.prepare(
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
