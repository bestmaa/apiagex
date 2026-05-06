import { randomUUID } from "node:crypto";
import {
  relationEntryReferenced,
  relationOneToOneConflict,
  relationTargetEntryInvalid,
  relationValueShapeInvalid,
} from "./relation-errors.js";
import {
  entryDataReferences,
  listEntryDataRows,
  parseEntryData,
  relationTypeOf,
} from "./relation-helpers.js";
import type { SqliteDatabase } from "./sqlite.js";
import { getSchemaById } from "./schema-repository.js";
import type {
  CreateEntryInput,
  EntryData,
  EntryRecord,
  UpdateEntryInput,
} from "./entry-repository.type.js";
import type { FieldRecord, SchemaRecord } from "./schema-repository.type.js";

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
  const normalizedData = normalizeEntryData(schema, input.data);
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    "INSERT INTO entries (id, schema_id, data_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
  ).run(id, input.schemaId, JSON.stringify(normalizedData), now, now);
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
  validateEntryData(db, schema, input.data, id);
  const normalizedData = normalizeEntryData(schema, input.data);
  const now = new Date().toISOString();
  db.prepare("UPDATE entries SET data_json = ?, updated_at = ? WHERE id = ?").run(
    JSON.stringify(normalizedData),
    now,
    id,
  );
  return requireEntry(db, id);
}

export function deleteEntry(db: SqliteDatabase, id: string): void {
  assertEntryNotReferenced(db, id);
  const result = db.prepare("DELETE FROM entries WHERE id = ?").run(id);
  if (result.changes === 0) {
    throw new Error("ENTRY_NOT_FOUND");
  }
}

function assertEntryNotReferenced(db: SqliteDatabase, entryId: string): void {
  const rows = listEntryDataRows(db);
  for (const row of rows) {
    if (row.id === entryId) continue;
    if (entryDataReferences(parseEntryData(row.dataJson), entryId)) {
      throw new Error(relationEntryReferenced(entryId));
    }
  }
}

function validateEntryData(
  db: SqliteDatabase,
  schema: SchemaRecord,
  data: EntryData,
  currentEntryId?: string,
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
      validateFieldValue(db, schema, field, value, currentEntryId);
    }
  }
}

function validateFieldValue(
  db: SqliteDatabase,
  schema: SchemaRecord,
  field: FieldRecord,
  value: unknown,
  currentEntryId?: string,
): void {
  if (field.type === "text" || field.type === "longText" || field.type === "media") {
    assertType(field, typeof value === "string");
  } else if (field.type === "number") {
    assertType(field, typeof value === "number" && Number.isFinite(value));
  } else if (field.type === "boolean") {
    assertType(field, typeof value === "boolean");
  } else if (field.type === "date") {
    assertType(field, typeof value === "string" && !Number.isNaN(Date.parse(value)));
  } else if (field.type === "relation") {
    assertRelation(db, schema, field, value, currentEntryId);
  }
}

function assertRelation(
  db: SqliteDatabase,
  schema: SchemaRecord,
  field: FieldRecord,
  value: unknown,
  currentEntryId?: string,
): void {
  const relationType = relationTypeOf(field);
  if (relationType === "oneToMany" || relationType === "manyToMany") {
    assertMultiRelation(db, field, value);
    return;
  }
  if (typeof value !== "string") {
    throw new Error(relationValueShapeInvalid(field.slug));
  }
  const target = getEntryById(db, String(value));
  if (!target || target.schemaId !== field.relationSchemaId) {
    throw new Error(relationTargetEntryInvalid(field.slug));
  }
  if (relationType === "oneToOne") {
    assertOneToOneAvailable(db, schema, field, value, currentEntryId);
  }
}

function assertMultiRelation(
  db: SqliteDatabase,
  field: FieldRecord,
  value: unknown,
): void {
  if (!Array.isArray(value)) {
    throw new Error(relationValueShapeInvalid(field.slug));
  }
  if (field.required && value.length === 0) {
    throw new Error(`ENTRY_FIELD_REQUIRED:${field.slug}`);
  }
  const seen = new Set<string>();
  for (const targetEntryId of value) {
    if (typeof targetEntryId !== "string") {
      throw new Error(relationValueShapeInvalid(field.slug));
    }
    if (seen.has(targetEntryId)) continue;
    seen.add(targetEntryId);
    const target = getEntryById(db, targetEntryId);
    if (!target || target.schemaId !== field.relationSchemaId) {
      throw new Error(relationTargetEntryInvalid(field.slug));
    }
  }
}

function normalizeEntryData(schema: SchemaRecord, data: EntryData): EntryData {
  const normalized: EntryData = { ...data };
  for (const field of schema.fields) {
    if (field.type !== "relation") continue;
    const value = normalized[field.slug];
    if (isMissing(value)) continue;
    const relationType = relationTypeOf(field);
    if (relationType === "oneToMany" || relationType === "manyToMany") {
      normalized[field.slug] = Array.isArray(value) ? [...new Set(value)] : value;
    }
  }
  return normalized;
}

function assertOneToOneAvailable(
  db: SqliteDatabase,
  schema: SchemaRecord,
  field: FieldRecord,
  targetEntryId: string,
  currentEntryId?: string,
): void {
  const rows = listEntryDataRows(db, "WHERE schema_id = ?", [schema.id]);
  for (const row of rows) {
    if (row.id === currentEntryId) continue;
    const data = parseEntryData(row.dataJson);
    if (data[field.slug] === targetEntryId) {
      throw new Error(relationOneToOneConflict(field.slug));
    }
  }
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
