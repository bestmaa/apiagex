import type { ApiagexDatabase, DatabaseQueryParam } from "./database-adapter.type.js";
import type {
  EntryData,
  EntryListOptions,
  EntryListResult,
  EntryRecord,
} from "./entry-repository.type.js";
import { getSchemaById } from "./schema-repository.js";
import type { SchemaRecord } from "./schema-repository.type.js";

type EntryRow = {
  id: string;
  schemaId: string;
  dataJson: string;
  createdAt: string;
  updatedAt: string;
};

export async function queryEntries(
  db: ApiagexDatabase,
  schemaId: string,
  options: EntryListOptions = {},
): Promise<EntryListResult> {
  const schema = await requireSchema(db, schemaId);
  const limit = clampListLimit(options.limit);
  const offset = Math.max(0, Math.floor(options.offset ?? 0));
  const search = options.search?.trim() ?? "";
  const selectedFields = validateSelectedFields(schema, options.fields);
  const where = search ? "WHERE schema_id = ? AND (data_json LIKE ? OR id LIKE ?)" : "WHERE schema_id = ?";
  const params: DatabaseQueryParam[] = search ? [schemaId, `%${search}%`, `%${search}%`] : [schemaId];
  const totalRow = await db.prepare(`SELECT COUNT(*) as total FROM entries ${where}`).get<{ total: number }>(...params);
  const rows = await db.prepare(`${entrySelectSql(where)} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .all<EntryRow>(...params, limit, offset);
  return {
    entries: rows.map((row) => projectEntry(rowToEntry(row), selectedFields)),
    limit,
    offset,
    total: totalRow?.total ?? 0,
  };
}

function clampListLimit(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return 50;
  return Math.min(100, Math.max(1, Math.floor(value)));
}

function validateSelectedFields(schema: SchemaRecord, fields: string[] | undefined): string[] | undefined {
  const selected = fields?.map((field) => field.trim()).filter(Boolean);
  if (!selected || selected.length === 0) return undefined;
  const allowed = new Set(schema.fields.map((field) => field.slug));
  for (const field of selected) {
    if (!allowed.has(field)) throw new Error("ENTRY_FIELD_UNKNOWN");
  }
  return [...new Set(selected)];
}

function projectEntry(entry: EntryRecord, fields: string[] | undefined): EntryRecord {
  if (!fields) return entry;
  const data: EntryData = {};
  for (const field of fields) {
    data[field] = entry.data[field];
  }
  return { ...entry, data };
}

async function requireSchema(db: ApiagexDatabase, schemaId: string): Promise<SchemaRecord> {
  const schema = await getSchemaById(db, schemaId);
  if (!schema) throw new Error("SCHEMA_NOT_FOUND");
  return schema;
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
