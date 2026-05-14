import type { ApiagexDatabase, DatabaseQueryParam } from "./database-adapter.type.js";
import type { EntryData } from "./entry-repository.type.js";
import type { FieldRecord, RelationType } from "./schema-repository.type.js";

type EntryDataRow = {
  dataJson: string;
  id: string;
};

export function relationTypeOf(field: FieldRecord): RelationType {
  return field.relationType ?? "manyToOne";
}

export function entryDataReferences(data: EntryData, entryId: string): boolean {
  return Object.values(data).some(
    (value) => value === entryId || (Array.isArray(value) && value.includes(entryId)),
  );
}

export async function listEntryDataRows(
  db: ApiagexDatabase,
  where = "",
  params: DatabaseQueryParam[] = [],
): Promise<EntryDataRow[]> {
  return db.prepare(`SELECT id, data_json as dataJson FROM entries ${where}`).all<EntryDataRow>(...params);
}

export function parseEntryData(dataJson: string): EntryData {
  return JSON.parse(dataJson) as EntryData;
}

export async function schemaEntriesUseField(
  db: ApiagexDatabase,
  schemaId: string,
  fieldSlug: string,
): Promise<boolean> {
  const rows = await listEntryDataRows(db, "WHERE schema_id = ?", [schemaId]);
  return rows.some((row) => {
    const value = parseEntryData(row.dataJson)[fieldSlug];
    return value !== undefined && value !== null && value !== "";
  });
}
