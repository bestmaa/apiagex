import { randomUUID } from "node:crypto";
import type { ApiagexDatabase } from "./database-adapter.type.js";
import {
  relationErrors,
  relationFieldUpdateUnsafe,
  relationSchemaReferenced,
} from "./relation-errors.js";
import { schemaEntriesUseField } from "./relation-helpers.js";
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
const fieldTypes: FieldType[] = ["text", "longText", "number", "boolean", "date", "json", "media", "relation"];
const relationTypes: RelationType[] = ["oneToOne", "oneToMany", "manyToOne", "manyToMany"];

export async function createSchema(db: ApiagexDatabase, input: CreateSchemaInput): Promise<SchemaRecord> {
  await validateSchemaInput(db, input);
  const schemaId = randomUUID();
  const now = new Date().toISOString();
  const description = input.description ?? "";

  await db.transaction(async () => {
    await db.prepare(
      "INSERT INTO schemas (id, name, slug, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
    ).run(schemaId, input.name, input.slug, description, now, now);
    for (const [index, field] of input.fields.entries()) {
      await insertField(db, schemaId, field, index);
    }
  });

  const created = await getSchemaById(db, schemaId);
  if (!created) throw new Error("SCHEMA_CREATE_FAILED");
  return created;
}

export async function listSchemas(db: ApiagexDatabase): Promise<SchemaRecord[]> {
  const rows = await db.prepare("SELECT id FROM schemas ORDER BY created_at ASC").all<{ id: string }>();
  const schemas = await Promise.all(rows.map((row) => getSchemaById(db, row.id)));
  return schemas.filter(isSchemaRecord);
}

export async function getSchemaById(db: ApiagexDatabase, id: string): Promise<SchemaRecord | undefined> {
  const schema = await db
    .prepare("SELECT id, name, slug, description FROM schemas WHERE id = ?")
    .get<Omit<SchemaRecord, "fields">>(id);
  return schema ? { ...schema, fields: await listFields(db, schema.id) } : undefined;
}

export async function getSchemaBySlug(db: ApiagexDatabase, slug: string): Promise<SchemaRecord | undefined> {
  const row = await db.prepare("SELECT id FROM schemas WHERE slug = ?").get<{ id: string }>(slug);
  return row ? getSchemaById(db, row.id) : undefined;
}

export async function updateSchema(
  db: ApiagexDatabase,
  id: string,
  input: UpdateSchemaInput,
): Promise<SchemaRecord> {
  if (!(await getSchemaById(db, id))) throw new Error("SCHEMA_NOT_FOUND");
  await assertSafeRelationUpdate(db, id, input);
  await validateSchemaInput(db, input);
  const now = new Date().toISOString();
  const description = input.description ?? "";

  await db.transaction(async () => {
    await db.prepare("UPDATE schemas SET name = ?, slug = ?, description = ?, updated_at = ? WHERE id = ?")
      .run(input.name, input.slug, description, now, id);
    await db.prepare("DELETE FROM fields WHERE schema_id = ?").run(id);
    for (const [index, field] of input.fields.entries()) {
      await insertField(db, id, field, index);
    }
  });

  const updated = await getSchemaById(db, id);
  if (!updated) throw new Error("SCHEMA_UPDATE_FAILED");
  return updated;
}

export async function deleteSchema(db: ApiagexDatabase, id: string): Promise<void> {
  await assertSchemaNotReferenced(db, id);
  const result = await db.prepare("DELETE FROM schemas WHERE id = ?").run(id);
  if (result.changes === 0) throw new Error("SCHEMA_NOT_FOUND");
}

async function assertSafeRelationUpdate(
  db: ApiagexDatabase,
  schemaId: string,
  input: UpdateSchemaInput,
): Promise<void> {
  const current = await getSchemaById(db, schemaId);
  if (!current) return;
  const nextBySlug = new Map(input.fields.map((field) => [field.slug, field]));
  for (const currentField of current.fields) {
    if (currentField.type !== "relation") continue;
    if (!(await schemaEntriesUseField(db, schemaId, currentField.slug))) continue;
    const nextField = nextBySlug.get(currentField.slug);
    if (!nextField || nextField.type !== "relation") throw new Error(relationFieldUpdateUnsafe(currentField.slug));
    const currentRelationType = currentField.relationType ?? "manyToOne";
    const nextRelationType = nextField.relationType ?? "manyToOne";
    if (currentField.relationSchemaId !== nextField.relationSchemaId || currentRelationType !== nextRelationType) {
      throw new Error(relationFieldUpdateUnsafe(currentField.slug));
    }
  }
}

async function assertSchemaNotReferenced(db: ApiagexDatabase, id: string): Promise<void> {
  const dependent = await db
    .prepare("SELECT schema_id as schemaId FROM fields WHERE relation_schema_id = ? AND schema_id != ? LIMIT 1")
    .get<{ schemaId: string }>(id, id);
  if (dependent) throw new Error(relationSchemaReferenced(id));
}

async function insertField(
  db: ApiagexDatabase,
  schemaId: string,
  field: CreateFieldInput,
  position: number,
): Promise<void> {
  await db.prepare(
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

async function listFields(db: ApiagexDatabase, schemaId: string): Promise<FieldRecord[]> {
  const rows = await db
    .prepare(
      "SELECT id, schema_id as schemaId, name, slug, type, relation_schema_id as relationSchemaId, relation_type as relationType, required, position FROM fields WHERE schema_id = ? ORDER BY position ASC",
    )
    .all<Omit<FieldRecord, "required"> & { required: number }>(schemaId);
  return rows.map((row) => ({ ...row, required: Boolean(row.required) }));
}

async function validateSchemaInput(db: ApiagexDatabase, input: CreateSchemaInput): Promise<void> {
  validateSlug(input.slug, "SCHEMA_SLUG_INVALID");
  if (input.fields.length === 0) throw new Error("SCHEMA_FIELDS_REQUIRED");
  for (const field of input.fields) {
    validateSlug(field.slug, "FIELD_SLUG_INVALID");
    if (!fieldTypes.includes(field.type)) throw new Error("FIELD_TYPE_INVALID");
    await validateRelationMetadata(db, field);
  }
}

async function validateRelationMetadata(db: ApiagexDatabase, field: CreateFieldInput): Promise<void> {
  if (field.type !== "relation") {
    if (field.relationSchemaId || field.relationType) throw new Error(relationErrors.metadataForNonRelationField);
    return;
  }
  if (!field.relationSchemaId) throw new Error(relationErrors.targetRequired);
  if (!(await getSchemaById(db, field.relationSchemaId))) throw new Error(relationErrors.targetMissing);
  if (field.relationType && !relationTypes.includes(field.relationType)) throw new Error(relationErrors.typeInvalid);
}

function validateSlug(slug: string, error: string): void {
  if (!slugPattern.test(slug)) throw new Error(error);
}

function isSchemaRecord(value: SchemaRecord | undefined): value is SchemaRecord {
  return Boolean(value);
}
