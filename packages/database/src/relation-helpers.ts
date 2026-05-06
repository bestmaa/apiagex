import type { EntryData } from "./entry-repository.type.js";
import type { FieldRecord, RelationType } from "./schema-repository.type.js";
import type { SqliteDatabase } from "./sqlite.js";

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

export function listEntryDataRows(db: SqliteDatabase, where = "", params: unknown[] = []): EntryDataRow[] {
  return db
    .prepare(`SELECT id, data_json as dataJson FROM entries ${where}`)
    .all(...params) as EntryDataRow[];
}

export function parseEntryData(dataJson: string): EntryData {
  return JSON.parse(dataJson) as EntryData;
}

export function schemaEntriesUseField(
  db: SqliteDatabase,
  schemaId: string,
  fieldSlug: string,
): boolean {
  const rows = listEntryDataRows(db, "WHERE schema_id = ?", [schemaId]);
  return rows.some((row) => {
    const value = parseEntryData(row.dataJson)[fieldSlug];
    return value !== undefined && value !== null && value !== "";
  });
}
