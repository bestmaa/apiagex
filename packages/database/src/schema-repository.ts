import { randomUUID } from "node:crypto";
import { relationErrors } from "./relation-errors.js";
import type { SqliteDatabase } from "./sqlite.js";
import type {
  CreateFieldInput,
  CreateSchemaInput,
  FieldRecord,
  FieldType,
  RelationType,
  SchemaRecord,
  UpdateSchemaInput,
} from "./schema-repository.type.js";

const slugPattern = /^[a-z][a-z0-9-]*$/;
const fieldTypes: FieldType[] = [
  "text",
  "longText",
  "number",
  "boolean",
  "date",
  "json",
  "media",
  "relation",
];
const relationTypes: RelationType[] = [
  "oneToOne",
  "oneToMany",
  "manyToOne",
  "manyToMany",
];

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

export function getSchemaBySlug(
  db: SqliteDatabase,
  slug: string,
): SchemaRecord | undefined {
  const row = db.prepare("SELECT id FROM schemas WHERE slug = ?").get(slug) as
    | { id: string }
    | undefined;
  return row ? getSchemaById(db, row.id) : undefined;
}

export function updateSchema(
  db: SqliteDatabase,
  id: string,
  input: UpdateSchemaInput,
): SchemaRecord {
  if (!getSchemaById(db, id)) {
    throw new Error("SCHEMA_NOT_FOUND");
  }
  validateSchemaInput(db, input);
  const now = new Date().toISOString();
  const description = input.description ?? "";
  const update = db.transaction(() => {
    db.prepare(
      "UPDATE schemas SET name = ?, slug = ?, description = ?, updated_at = ? WHERE id = ?",
    ).run(input.name, input.slug, description, now, id);
    db.prepare("DELETE FROM fields WHERE schema_id = ?").run(id);
    input.fields.forEach((field, index) => insertField(db, id, field, index));
  });
  update();

  const updated = getSchemaById(db, id);
  if (!updated) {
    throw new Error("SCHEMA_UPDATE_FAILED");
  }
  return updated;
}

export function deleteSchema(db: SqliteDatabase, id: string): void {
  const result = db.prepare("DELETE FROM schemas WHERE id = ?").run(id);
  if (result.changes === 0) {
    throw new Error("SCHEMA_NOT_FOUND");
  }
}

function insertField(
  db: SqliteDatabase,
  schemaId: string,
  field: CreateFieldInput,
  position: number,
): void {
  db.prepare(
    "INSERT INTO fields (id, schema_id, name, slug, type, relation_schema_id, relation_type, required, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
  ).run(
    randomUUID(),
    schemaId,
    field.name,
    field.slug,
    field.type,
    field.relationSchemaId ?? null,
    field.relationType ?? null,
    field.required ? 1 : 0,
    position,
  );
}

function listFields(db: SqliteDatabase, schemaId: string): FieldRecord[] {
  const rows = db
    .prepare(
      "SELECT id, schema_id as schemaId, name, slug, type, relation_schema_id as relationSchemaId, relation_type as relationType, required, position FROM fields WHERE schema_id = ? ORDER BY position ASC",
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
    if (!fieldTypes.includes(field.type)) {
      throw new Error("FIELD_TYPE_INVALID");
    }
    validateRelationMetadata(db, field);
  }
}

function validateRelationMetadata(db: SqliteDatabase, field: CreateFieldInput): void {
  if (field.type !== "relation") {
    if (field.relationSchemaId || field.relationType) {
      throw new Error(relationErrors.metadataForNonRelationField);
    }
    return;
  }
  if (!field.relationSchemaId) {
    throw new Error(relationErrors.targetRequired);
  }
  if (!getSchemaById(db, field.relationSchemaId)) {
    throw new Error(relationErrors.targetMissing);
  }
  if (field.relationType && !relationTypes.includes(field.relationType)) {
    throw new Error(relationErrors.typeInvalid);
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
