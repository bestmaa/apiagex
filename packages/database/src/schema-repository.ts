import { randomUUID } from "node:crypto";
import type { SqliteDatabase } from "./sqlite.js";
import type {
  CreateFieldInput,
  CreateSchemaInput,
  FieldRecord,
  SchemaRecord,
} from "./schema-repository.type.js";

const slugPattern = /^[a-z][a-z0-9-]*$/;

export function createSchema(
  db: SqliteDatabase,
  input: CreateSchemaInput,
): SchemaRecord {
  validateSchemaInput(db, input);
  const schemaId = randomUUID();
  const now = new Date().toISOString();
  const description = input.description ?? "";

  const create = db.transaction(() => {
    db.prepare(
      "INSERT INTO schemas (id, name, slug, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
    ).run(schemaId, input.name, input.slug, description, now, now);
    input.fields.forEach((field, index) => insertField(db, schemaId, field, index));
  });
  create();

  const created = getSchemaById(db, schemaId);
  if (!created) {
    throw new Error("SCHEMA_CREATE_FAILED");
  }
  return created;
}

export function listSchemas(db: SqliteDatabase): SchemaRecord[] {
  const rows = db.prepare("SELECT id FROM schemas ORDER BY created_at ASC").all() as {
    id: string;
  }[];
  return rows.map((row) => getSchemaById(db, row.id)).filter(isSchemaRecord);
}

export function getSchemaById(
  db: SqliteDatabase,
  id: string,
): SchemaRecord | undefined {
  const schema = db.prepare("SELECT id, name, slug, description FROM schemas WHERE id = ?").get(id) as
    | Omit<SchemaRecord, "fields">
    | undefined;
  if (!schema) {
    return undefined;
  }
  return { ...schema, fields: listFields(db, schema.id) };
}

function insertField(
  db: SqliteDatabase,
  schemaId: string,
  field: CreateFieldInput,
  position: number,
): void {
  db.prepare(
    "INSERT INTO fields (id, schema_id, name, slug, type, relation_schema_id, required, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  ).run(
    randomUUID(),
    schemaId,
    field.name,
    field.slug,
    field.type,
    field.relationSchemaId ?? null,
    field.required ? 1 : 0,
    position,
  );
}

function listFields(db: SqliteDatabase, schemaId: string): FieldRecord[] {
  const rows = db
    .prepare(
      "SELECT id, schema_id as schemaId, name, slug, type, relation_schema_id as relationSchemaId, required, position FROM fields WHERE schema_id = ? ORDER BY position ASC",
    )
    .all(schemaId) as Array<Omit<FieldRecord, "required"> & { required: number }>;

  return rows.map((row) => ({ ...row, required: Boolean(row.required) }));
}

function validateSchemaInput(db: SqliteDatabase, input: CreateSchemaInput): void {
  validateSlug(input.slug, "SCHEMA_SLUG_INVALID");
  if (input.fields.length === 0) {
    throw new Error("SCHEMA_FIELDS_REQUIRED");
  }
  for (const field of input.fields) {
    validateSlug(field.slug, "FIELD_SLUG_INVALID");
    if (field.type === "relation" && !field.relationSchemaId) {
      throw new Error("RELATION_TARGET_REQUIRED");
    }
    if (field.relationSchemaId && !getSchemaById(db, field.relationSchemaId)) {
      throw new Error("RELATION_TARGET_MISSING");
    }
  }
}

function validateSlug(slug: string, error: string): void {
  if (!slugPattern.test(slug)) {
    throw new Error(error);
  }
}

function isSchemaRecord(value: SchemaRecord | undefined): value is SchemaRecord {
  return Boolean(value);
}
