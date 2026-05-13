import {
  getEntryById,
  getSchemaById,
  relationTypeOf,
  type EntryRecord,
  type SchemaRecord,
  type SqliteDatabase,
} from "apiagex-database";

export type PopulatedEntryRecord = Omit<EntryRecord, "data"> & {
  data: Record<string, unknown>;
};

export function shouldPopulateRelations(populate: unknown): boolean {
  return populate === "relations" || populate === "all" || populate === "*";
}

export function populateEntryRelations(
  database: SqliteDatabase,
  schema: SchemaRecord,
  entry: EntryRecord,
  canReadSchema: (schema: SchemaRecord) => boolean,
): PopulatedEntryRecord {
  const data: Record<string, unknown> = { ...entry.data };
  for (const field of schema.fields) {
    if (field.type !== "relation" || !field.relationSchemaId) continue;
    const relationSchemaId = field.relationSchemaId;
    const value = entry.data[field.slug];
    if (value === undefined || value === null || value === "") continue;
    if (relationTypeOf(field) === "oneToMany" || relationTypeOf(field) === "manyToMany") {
      data[field.slug] = Array.isArray(value)
        ? value.flatMap((entryId) => {
            const related = resolveRelation(database, relationSchemaId, entryId, canReadSchema);
            return related ? [related] : [];
          })
        : [];
      continue;
    }
    data[field.slug] =
      typeof value === "string"
        ? resolveRelation(database, relationSchemaId, value, canReadSchema) ?? null
        : null;
  }
  return { ...entry, data };
}

function resolveRelation(
  database: SqliteDatabase,
  relationSchemaId: string,
  entryId: unknown,
  canReadSchema: (schema: SchemaRecord) => boolean,
): EntryRecord | undefined {
  if (typeof entryId !== "string") return undefined;
  const entry = getEntryById(database, entryId);
  if (!entry || entry.schemaId !== relationSchemaId) return undefined;
  const schema = getSchemaById(database, entry.schemaId);
  if (!schema || !canReadSchema(schema)) return undefined;
  return entry;
}
