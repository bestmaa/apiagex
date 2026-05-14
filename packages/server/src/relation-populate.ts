import {
  getEntryById,
  getSchemaById,
  relationTypeOf,
  type ApiagexDatabase,
  type EntryRecord,
  type SchemaRecord,
} from "@apiagex/database";

export type PopulatedEntryRecord = Omit<EntryRecord, "data"> & {
  data: Record<string, unknown>;
};

export function shouldPopulateRelations(populate: unknown): boolean {
  return populate === "relations" || populate === "all" || populate === "*";
}

export async function populateEntryRelations(
  database: ApiagexDatabase,
  schema: SchemaRecord,
  entry: EntryRecord,
  canReadSchema: (schema: SchemaRecord) => Promise<boolean>,
): Promise<PopulatedEntryRecord> {
  const data: Record<string, unknown> = { ...entry.data };
  for (const field of schema.fields) {
    if (field.type !== "relation" || !field.relationSchemaId) continue;
    const relationSchemaId = field.relationSchemaId;
    const value = entry.data[field.slug];
    if (value === undefined || value === null || value === "") continue;
    if (relationTypeOf(field) === "oneToMany" || relationTypeOf(field) === "manyToMany") {
      data[field.slug] = Array.isArray(value)
        ? (await Promise.all(value.map((entryId) => resolveRelation(database, relationSchemaId, entryId, canReadSchema))))
            .filter(isEntryRecord)
        : [];
      continue;
    }
    data[field.slug] =
      typeof value === "string"
        ? await resolveRelation(database, relationSchemaId, value, canReadSchema) ?? null
        : null;
  }
  return { ...entry, data };
}

async function resolveRelation(
  database: ApiagexDatabase,
  relationSchemaId: string,
  entryId: unknown,
  canReadSchema: (schema: SchemaRecord) => Promise<boolean>,
): Promise<EntryRecord | undefined> {
  if (typeof entryId !== "string") return undefined;
  const entry = await getEntryById(database, entryId);
  if (!entry || entry.schemaId !== relationSchemaId) return undefined;
  const schema = await getSchemaById(database, entry.schemaId);
  if (!schema || !(await canReadSchema(schema))) return undefined;
  return entry;
}

function isEntryRecord(value: EntryRecord | undefined): value is EntryRecord {
  return Boolean(value);
}
