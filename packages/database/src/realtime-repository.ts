import type { SqliteDatabase } from "./sqlite.js";
import { getSchemaById, listSchemas } from "./schema-repository.js";
import type {
  RealtimeConfigRecord,
  RealtimeEventType,
  SetRealtimeConfigInput,
} from "./realtime-repository.type.js";

const allowedEvents = new Set<RealtimeEventType>(["entry.created", "entry.updated", "entry.deleted"]);

type RealtimeConfigRow = Omit<RealtimeConfigRecord, "enabled" | "events"> & {
  enabled: number;
  eventsJson: string;
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
