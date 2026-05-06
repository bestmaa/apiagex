import { randomUUID } from "node:crypto";
import { relationTargetEntryInvalid, relationValueShapeInvalid } from "./relation-errors.js";
import type { SqliteDatabase } from "./sqlite.js";
import { getSchemaById } from "./schema-repository.js";
import type {
  CreateEntryInput,
  EntryData,
  EntryRecord,
  UpdateEntryInput,
} from "./entry-repository.type.js";
import type { FieldRecord, RelationType, SchemaRecord } from "./schema-repository.type.js";

type EntryRow = {
  id: string;
  schemaId: string;
  dataJson: string;
  createdAt: string;
  updatedAt: string;
};

export function createEntry(db: SqliteDatabase, input: CreateEntryInput): EntryRecord {
  const schema = requireSchema(db, input.schemaId);
  validateEntryData(db, schema, input.data);
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    "INSERT INTO entries (id, schema_id, data_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
  ).run(id, input.schemaId, JSON.stringify(input.data), now, now);
  return requireEntry(db, id);
}

export function listEntries(db: SqliteDatabase, schemaId: string): EntryRecord[] {
  requireSchema(db, schemaId);
  const rows = db
    .prepare(
      "SELECT id, schema_id as schemaId, data_json as dataJson, created_at as createdAt, updated_at as updatedAt FROM entries WHERE schema_id = ? ORDER BY created_at ASC",
    )
    .all(schemaId) as EntryRow[];
  return rows.map(rowToEntry);
}

export function getEntryById(
  db: SqliteDatabase,
  id: string,
): EntryRecord | undefined {
  const row = db.prepare(entrySelectSql("WHERE id = ?")).get(id) as EntryRow | undefined;
  return row ? rowToEntry(row) : undefined;
}

export function updateEntry(
  db: SqliteDatabase,
  id: string,
  input: UpdateEntryInput,
): EntryRecord {
  const current = requireEntry(db, id);
  const schema = requireSchema(db, current.schemaId);
  validateEntryData(db, schema, input.data);
  const now = new Date().toISOString();
  db.prepare("UPDATE entries SET data_json = ?, updated_at = ? WHERE id = ?").run(
    JSON.stringify(input.data),
    now,
    id,
  );
  return requireEntry(db, id);
}

export function deleteEntry(db: SqliteDatabase, id: string): void {
  const result = db.prepare("DELETE FROM entries WHERE id = ?").run(id);
  if (result.changes === 0) {
    throw new Error("ENTRY_NOT_FOUND");
  }
}

function validateEntryData(
  db: SqliteDatabase,
  schema: SchemaRecord,
  data: EntryData,
): void {
  if (!isRecord(data)) {
    throw new Error("ENTRY_DATA_INVALID");
  }
  const fieldSlugs = new Set(schema.fields.map((field) => field.slug));
  for (const key of Object.keys(data)) {
    if (!fieldSlugs.has(key)) {
      throw new Error("ENTRY_FIELD_UNKNOWN");
    }
  }
  for (const field of schema.fields) {
    const value = data[field.slug];
    if (field.required && isMissing(value)) {
      throw new Error(`ENTRY_FIELD_REQUIRED:${field.slug}`);
    }
    if (!isMissing(value)) {
      validateFieldValue(db, field, value);
    }
  }
}

function validateFieldValue(db: SqliteDatabase, field: FieldRecord, value: unknown): void {
  if (field.type === "text" || field.type === "longText" || field.type === "media") {
    assertType(field, typeof value === "string");
  } else if (field.type === "number") {
    assertType(field, typeof value === "number" && Number.isFinite(value));
  } else if (field.type === "boolean") {
    assertType(field, typeof value === "boolean");
  } else if (field.type === "date") {
    assertType(field, typeof value === "string" && !Number.isNaN(Date.parse(value)));
  } else if (field.type === "relation") {
    assertRelation(db, field, value);
  }
}

function assertRelation(db: SqliteDatabase, field: FieldRecord, value: unknown): void {
  if (relationTypeOf(field) !== "manyToOne") {
    throw new Error(relationValueShapeInvalid(field.slug));
  }
  if (typeof value !== "string") {
    throw new Error(relationValueShapeInvalid(field.slug));
  }
  const target = getEntryById(db, String(value));
  if (!target || target.schemaId !== field.relationSchemaId) {
    throw new Error(relationTargetEntryInvalid(field.slug));
  }
}

function relationTypeOf(field: FieldRecord): RelationType {
  return field.relationType ?? "manyToOne";
}

function assertType(field: FieldRecord, valid: boolean): void {
  if (!valid) {
    throw new Error(`ENTRY_FIELD_TYPE_INVALID:${field.slug}`);
  }
}

function isMissing(value: unknown): boolean {
  return value === undefined || value === null || value === "";
}

function isRecord(value: unknown): value is EntryData {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireSchema(db: SqliteDatabase, schemaId: string): SchemaRecord {
  const schema = getSchemaById(db, schemaId);
  if (!schema) {
    throw new Error("SCHEMA_NOT_FOUND");
  }
  return schema;
}

function requireEntry(db: SqliteDatabase, id: string): EntryRecord {
  const entry = getEntryById(db, id);
  if (!entry) {
    throw new Error("ENTRY_NOT_FOUND");
  }
  return entry;
}

function rowToEntry(row: EntryRow): EntryRecord {
  return {
    id: row.id,
    schemaId: row.schemaId,
    data: JSON.parse(row.dataJson) as EntryData,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function entrySelectSql(where: string): string {
  return `SELECT id, schema_id as schemaId, data_json as dataJson, created_at as createdAt, updated_at as updatedAt FROM entries ${where}`;
}
