import { randomUUID } from "node:crypto";
import type { ApiagexDatabase } from "./database-adapter.type.js";
import type { CreateEntryInput, EntryData, EntryRecord, UpdateEntryInput } from "./entry-repository.type.js";
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
import { getSchemaById } from "./schema-repository.js";
import type { FieldRecord, SchemaRecord } from "./schema-repository.type.js";

type EntryRow = { id: string; schemaId: string; dataJson: string; createdAt: string; updatedAt: string };

export async function createEntry(db: ApiagexDatabase, input: CreateEntryInput): Promise<EntryRecord> {
  const schema = await requireSchema(db, input.schemaId);
  await validateEntryData(db, schema, input.data);
  const normalizedData = normalizeEntryData(schema, input.data);
  const id = randomUUID();
  const now = new Date().toISOString();
  await db.prepare(
    "INSERT INTO entries (id, schema_id, data_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
  ).run(id, input.schemaId, JSON.stringify(normalizedData), now, now);
  return requireEntry(db, id);
}

export async function listEntries(db: ApiagexDatabase, schemaId: string): Promise<EntryRecord[]> {
  await requireSchema(db, schemaId);
  const rows = await db
    .prepare(
      "SELECT id, schema_id as schemaId, data_json as dataJson, created_at as createdAt, updated_at as updatedAt FROM entries WHERE schema_id = ? ORDER BY created_at ASC",
    )
    .all<EntryRow>(schemaId);
  return rows.map(rowToEntry);
}

export async function getEntryById(db: ApiagexDatabase, id: string): Promise<EntryRecord | undefined> {
  const row = await db.prepare(entrySelectSql("WHERE id = ?")).get<EntryRow>(id);
  return row ? rowToEntry(row) : undefined;
}

export async function updateEntry(
  db: ApiagexDatabase,
  id: string,
  input: UpdateEntryInput,
): Promise<EntryRecord> {
  const current = await requireEntry(db, id);
  const schema = await requireSchema(db, current.schemaId);
  await validateEntryData(db, schema, input.data, id);
  const normalizedData = normalizeEntryData(schema, input.data);
  await db.prepare("UPDATE entries SET data_json = ?, updated_at = ? WHERE id = ?")
    .run(JSON.stringify(normalizedData), new Date().toISOString(), id);
  return requireEntry(db, id);
}

export async function deleteEntry(db: ApiagexDatabase, id: string): Promise<void> {
  await assertEntryNotReferenced(db, id);
  const result = await db.prepare("DELETE FROM entries WHERE id = ?").run(id);
  if (result.changes === 0) throw new Error("ENTRY_NOT_FOUND");
}

async function assertEntryNotReferenced(db: ApiagexDatabase, entryId: string): Promise<void> {
  const rows = await listEntryDataRows(db);
  for (const row of rows) {
    if (row.id === entryId) continue;
    if (entryDataReferences(parseEntryData(row.dataJson), entryId)) throw new Error(relationEntryReferenced(entryId));
  }
}

async function validateEntryData(
  db: ApiagexDatabase,
  schema: SchemaRecord,
  data: EntryData,
  currentEntryId?: string,
): Promise<void> {
  if (!isRecord(data)) throw new Error("ENTRY_DATA_INVALID");
  const fieldSlugs = new Set(schema.fields.map((field) => field.slug));
  for (const key of Object.keys(data)) {
    if (!fieldSlugs.has(key)) throw new Error("ENTRY_FIELD_UNKNOWN");
  }
  for (const field of schema.fields) {
    const value = data[field.slug];
    if (field.required && isMissing(value)) throw new Error(`ENTRY_FIELD_REQUIRED:${field.slug}`);
    if (!isMissing(value)) await validateFieldValue(db, schema, field, value, currentEntryId);
  }
}

async function validateFieldValue(
  db: ApiagexDatabase,
  schema: SchemaRecord,
  field: FieldRecord,
  value: unknown,
  currentEntryId?: string,
): Promise<void> {
  if (isStringField(field.type)) {
    assertType(field, typeof value === "string");
  } else if (field.type === "email") {
    assertType(field, typeof value === "string" && isEmail(value));
  } else if (field.type === "url") {
    assertType(field, typeof value === "string" && isHttpUrl(value));
  } else if (field.type === "number" || field.type === "decimal" || field.type === "currency") {
    assertType(field, typeof value === "number" && Number.isFinite(value));
  } else if (field.type === "integer") {
    assertType(field, typeof value === "number" && Number.isInteger(value));
  } else if (field.type === "boolean") {
    assertType(field, typeof value === "boolean");
  } else if (field.type === "date") {
    assertType(field, typeof value === "string" && !Number.isNaN(Date.parse(value)));
  } else if (field.type === "datetime") {
    assertType(field, typeof value === "string" && isDateTime(value));
  } else if (field.type === "time") {
    assertType(field, typeof value === "string" && isTime(value));
  } else if (field.type === "enum") {
    assertType(field, typeof value === "string" && field.options.includes(value));
  } else if (field.type === "multiSelect") {
    if (field.required && Array.isArray(value) && value.length === 0) throw new Error(`ENTRY_FIELD_REQUIRED:${field.slug}`);
    assertType(field, Array.isArray(value) && value.every((item) => typeof item === "string" && field.options.includes(item)));
  } else if (field.type === "relation") {
    await assertRelation(db, schema, field, value, currentEntryId);
  }
}

async function assertRelation(
  db: ApiagexDatabase,
  schema: SchemaRecord,
  field: FieldRecord,
  value: unknown,
  currentEntryId?: string,
): Promise<void> {
  const relationType = relationTypeOf(field);
  if (relationType === "oneToMany" || relationType === "manyToMany") {
    await assertMultiRelation(db, field, value);
    return;
  }
  if (typeof value !== "string") throw new Error(relationValueShapeInvalid(field.slug));
  const target = await getEntryById(db, String(value));
  if (!target || target.schemaId !== field.relationSchemaId) throw new Error(relationTargetEntryInvalid(field.slug));
  if (relationType === "oneToOne") await assertOneToOneAvailable(db, schema, field, value, currentEntryId);
}

async function assertMultiRelation(db: ApiagexDatabase, field: FieldRecord, value: unknown): Promise<void> {
  if (!Array.isArray(value)) throw new Error(relationValueShapeInvalid(field.slug));
  if (field.required && value.length === 0) throw new Error(`ENTRY_FIELD_REQUIRED:${field.slug}`);
  const seen = new Set<string>();
  for (const targetEntryId of value) {
    if (typeof targetEntryId !== "string") throw new Error(relationValueShapeInvalid(field.slug));
    if (seen.has(targetEntryId)) continue;
    seen.add(targetEntryId);
    const target = await getEntryById(db, targetEntryId);
    if (!target || target.schemaId !== field.relationSchemaId) throw new Error(relationTargetEntryInvalid(field.slug));
  }
}

function normalizeEntryData(schema: SchemaRecord, data: EntryData): EntryData {
  const normalized: EntryData = { ...data };
  for (const field of schema.fields) {
    const value = normalized[field.slug];
    if (isMissing(value)) continue;
    if (field.type === "multiSelect") {
      normalized[field.slug] = Array.isArray(value) ? [...new Set(value)] : value;
      continue;
    }
    if (field.type !== "relation") continue;
    const relationType = relationTypeOf(field);
    if (relationType === "oneToMany" || relationType === "manyToMany") {
      normalized[field.slug] = Array.isArray(value) ? [...new Set(value)] : value;
    }
  }
  return normalized;
}

async function assertOneToOneAvailable(
  db: ApiagexDatabase,
  schema: SchemaRecord,
  field: FieldRecord,
  targetEntryId: string,
  currentEntryId?: string,
): Promise<void> {
  const rows = await listEntryDataRows(db, "WHERE schema_id = ?", [schema.id]);
  for (const row of rows) {
    if (row.id === currentEntryId) continue;
    const data = parseEntryData(row.dataJson);
    if (data[field.slug] === targetEntryId) throw new Error(relationOneToOneConflict(field.slug));
  }
}

function assertType(field: FieldRecord, valid: boolean): void {
  if (!valid) throw new Error(`ENTRY_FIELD_TYPE_INVALID:${field.slug}`);
}

function isStringField(type: FieldRecord["type"]): boolean {
  return [
    "file",
    "image",
    "longText",
    "media",
    "password",
    "richText",
    "text",
  ].includes(type);
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isDateTime(value: string): boolean {
  return value.includes("T") && !Number.isNaN(Date.parse(value));
}

function isTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value);
}

function isMissing(value: unknown): boolean {
  return value === undefined || value === null || value === "";
}

function isRecord(value: unknown): value is EntryData {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function requireSchema(db: ApiagexDatabase, schemaId: string): Promise<SchemaRecord> {
  const schema = await getSchemaById(db, schemaId);
  if (!schema) throw new Error("SCHEMA_NOT_FOUND");
  return schema;
}

async function requireEntry(db: ApiagexDatabase, id: string): Promise<EntryRecord> {
  const entry = await getEntryById(db, id);
  if (!entry) throw new Error("ENTRY_NOT_FOUND");
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
