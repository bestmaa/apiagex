import {
  getSchemaById,
  relationTypeOf,
  type ApiagexDatabase,
  type EntryData,
  type EntryRecord,
  type SchemaRecord,
} from "@apiagex/database";

type EntryRow = { id: string; schemaId: string; dataJson: string; createdAt: string; updatedAt: string };

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
  return (await populateEntriesRelations(database, schema, [entry], canReadSchema))[0] ?? { ...entry, data: { ...entry.data } };
}

export async function populateEntriesRelations(
  database: ApiagexDatabase,
  schema: SchemaRecord,
  entries: EntryRecord[],
  canReadSchema: (schema: SchemaRecord) => Promise<boolean>,
): Promise<PopulatedEntryRecord[]> {
  if (entries.length === 0) return [];
  const relationFields = schema.fields.filter((field) => field.type === "relation" && field.relationSchemaId);
  if (relationFields.length === 0) return entries.map((entry) => ({ ...entry, data: { ...entry.data } }));

  const relationIds = new Set<string>();
  for (const entry of entries) {
    for (const field of relationFields) {
      const value = entry.data[field.slug];
      if (relationTypeOf(field) === "oneToMany" || relationTypeOf(field) === "manyToMany") {
        if (Array.isArray(value)) {
          for (const entryId of value) {
            if (typeof entryId === "string") relationIds.add(entryId);
          }
        }
        continue;
      }
      if (typeof value === "string") relationIds.add(value);
    }
  }

  const relationEntries = await getEntriesByIds(database, [...relationIds]);
  const canReadSchemaCache = new Map<string, Promise<boolean>>();

  async function canReadRelationSchema(relationSchemaId: string): Promise<boolean> {
    const cached = canReadSchemaCache.get(relationSchemaId);
    if (cached) return cached;
    const allowed = (async () => {
      const targetSchema = await getSchemaById(database, relationSchemaId);
      return targetSchema ? canReadSchema(targetSchema) : false;
    })();
    canReadSchemaCache.set(relationSchemaId, allowed);
    return allowed;
  }

  async function resolveRelation(relationSchemaId: string, entryId: unknown): Promise<EntryRecord | undefined> {
    if (typeof entryId !== "string") return undefined;
    const entry = relationEntries.get(entryId);
    if (!entry || entry.schemaId !== relationSchemaId) return undefined;
    return (await canReadRelationSchema(relationSchemaId)) ? entry : undefined;
  }

  return Promise.all(entries.map((entry) => populateEntryFromBatch(schema, entry, resolveRelation)));
}

async function populateEntryFromBatch(
  schema: SchemaRecord,
  entry: EntryRecord,
  resolveRelation: (relationSchemaId: string, entryId: unknown) => Promise<EntryRecord | undefined>,
): Promise<PopulatedEntryRecord> {
  const data: Record<string, unknown> = { ...entry.data };
  for (const field of schema.fields) {
    if (field.type !== "relation" || !field.relationSchemaId) continue;
    const relationSchemaId = field.relationSchemaId;
    const value = entry.data[field.slug];
    if (value === undefined || value === null || value === "") continue;
    if (relationTypeOf(field) === "oneToMany" || relationTypeOf(field) === "manyToMany") {
      data[field.slug] = Array.isArray(value)
        ? (await Promise.all(value.map((entryId) => resolveRelation(relationSchemaId, entryId))))
            .filter(isEntryRecord)
        : [];
      continue;
    }
    data[field.slug] =
      typeof value === "string"
        ? await resolveRelation(relationSchemaId, value) ?? null
        : null;
  }
  return { ...entry, data };
}

async function getEntriesByIds(database: ApiagexDatabase, entryIds: string[]): Promise<Map<string, EntryRecord>> {
  const uniqueIds = [...new Set(entryIds)];
  const entries = new Map<string, EntryRecord>();
  for (const chunk of chunks(uniqueIds, 500)) {
    if (chunk.length === 0) continue;
    const placeholders = chunk.map(() => "?").join(", ");
    const rows = await database
      .prepare(
        `SELECT id, schema_id as schemaId, data_json as dataJson, created_at as createdAt, updated_at as updatedAt FROM entries WHERE id IN (${placeholders})`,
      )
      .all<EntryRow>(...chunk);
    for (const row of rows) {
      const entry = rowToEntry(row);
      entries.set(entry.id, entry);
    }
  }
  return entries;
}

function chunks<TValue>(values: TValue[], size: number): TValue[][] {
  const result: TValue[][] = [];
  for (let index = 0; index < values.length; index += size) result.push(values.slice(index, index + size));
  return result;
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

function isEntryRecord(value: EntryRecord | undefined): value is EntryRecord {
  return Boolean(value);
}
