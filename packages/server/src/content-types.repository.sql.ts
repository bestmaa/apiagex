import Database from 'better-sqlite3';

import { makeFieldRecord, mapFieldRow } from './content-types.repository.helpers.js';
import { DEFAULT_CONTENT_TYPE_PERMISSIONS, normalizeContentTypePermissions } from './content-type-permissions.js';
import type {
  ContentFieldRow,
  ContentTypeInput,
  ContentTypeRecord,
} from './content-types.repository.type.js';
import type { ContentTypeFieldInput } from './content-types.routes.type.js';
import type { ContentTypeRowView } from './content-types.repository.sql.type.js';

export function createSchema(): string {
  return [
    'CREATE TABLE IF NOT EXISTS content_types (',
    '  id TEXT PRIMARY KEY,',
    '  display_name TEXT NOT NULL,',
    '  kind TEXT NOT NULL,',
    "  permissions_json TEXT NOT NULL DEFAULT '{\"create\":[\"admin\",\"editor\"],\"delete\":[\"admin\"],\"list\":[\"admin\",\"editor\",\"viewer\"],\"read\":[\"admin\",\"editor\",\"viewer\"],\"update\":[\"admin\"]}',",
    '  realtime_create_enabled INTEGER,',
    '  realtime_delete_enabled INTEGER,',
    '  realtime_enabled INTEGER NOT NULL DEFAULT 0,',
    '  realtime_update_enabled INTEGER,',
    '  slug TEXT NOT NULL UNIQUE,',
    '  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,',
    '  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP',
    ');',
    'CREATE TABLE IF NOT EXISTS content_fields (',
    '  id TEXT PRIMARY KEY,',
    '  content_type_id TEXT NOT NULL,',
    '  field_key TEXT NOT NULL,',
    '  label TEXT NOT NULL,',
    '  type TEXT NOT NULL,',
    '  required INTEGER NOT NULL DEFAULT 0,',
    '  repeatable INTEGER NOT NULL DEFAULT 0,',
    '  sort_order INTEGER NOT NULL DEFAULT 0,',
    "  settings_json TEXT NOT NULL DEFAULT '{}',",
    '  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,',
    '  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,',
    '  FOREIGN KEY (content_type_id) REFERENCES content_types(id) ON DELETE CASCADE,',
    '  UNIQUE (content_type_id, field_key)',
    ');',
  ].join('\n');
}

export function ensureContentTypeColumns(database: Database.Database): void {
  const columns = database.prepare("PRAGMA table_info('content_types')").all() as Array<{ name: string }>;

  if (!columns.some((column) => column.name === 'permissions_json')) {
    addColumn(
      database,
      `ALTER TABLE content_types ADD COLUMN permissions_json TEXT NOT NULL DEFAULT '${serializeDefaultPermissions()}'`,
    );
  }

  if (!columns.some((column) => column.name === 'realtime_create_enabled')) {
    addColumn(database, 'ALTER TABLE content_types ADD COLUMN realtime_create_enabled INTEGER');
  }

  if (!columns.some((column) => column.name === 'realtime_delete_enabled')) {
    addColumn(database, 'ALTER TABLE content_types ADD COLUMN realtime_delete_enabled INTEGER');
  }

  if (!columns.some((column) => column.name === 'realtime_enabled')) {
    addColumn(database, 'ALTER TABLE content_types ADD COLUMN realtime_enabled INTEGER NOT NULL DEFAULT 0');
  }

  if (!columns.some((column) => column.name === 'realtime_update_enabled')) {
    addColumn(database, 'ALTER TABLE content_types ADD COLUMN realtime_update_enabled INTEGER');
  }
}

export function listContentTypeRows(database: Database.Database): readonly ContentTypeRowView[] {
  return database
    .prepare(
      'SELECT id, display_name, kind, permissions_json, realtime_create_enabled, realtime_delete_enabled, realtime_enabled, realtime_update_enabled, slug FROM content_types ORDER BY display_name ASC',
    )
    .all() as ContentTypeRowView[];
}

export function getContentTypeRow(
  database: Database.Database,
  id: string,
): ContentTypeRowView | undefined {
  return database
    .prepare(
      'SELECT id, display_name, kind, permissions_json, realtime_create_enabled, realtime_delete_enabled, realtime_enabled, realtime_update_enabled, slug FROM content_types WHERE id = ?',
    )
    .get(id) as ContentTypeRowView | undefined;
}

export function listContentFieldRows(database: Database.Database, contentTypeId: string): readonly ContentFieldRow[] {
  return database
    .prepare(
      'SELECT content_type_id, field_key, label, type, required, repeatable, sort_order, settings_json FROM content_fields WHERE content_type_id = ? ORDER BY sort_order ASC',
    )
    .all(contentTypeId) as ContentFieldRow[];
}

export function saveContentType(database: Database.Database, record: ContentTypeRecord): void {
  database
    .prepare(
      'INSERT INTO content_types (id, display_name, kind, permissions_json, realtime_create_enabled, realtime_delete_enabled, realtime_enabled, realtime_update_enabled, slug) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    )
    .run(
      record.id,
      record.displayName,
      record.kind,
      JSON.stringify(record.permissions),
      record.realtimeActions.create ? 1 : 0,
      record.realtimeActions.delete ? 1 : 0,
      record.realtimeEnabled ? 1 : 0,
      record.realtimeActions.update ? 1 : 0,
      record.slug,
    );
}

export function saveContentFields(database: Database.Database, record: ContentTypeRecord): void {
  for (const field of record.fields) {
    saveContentField(database, makeFieldRecord(record.id, field));
  }
}

export function saveContentField(database: Database.Database, record: ReturnType<typeof makeFieldRecord>): void {
  database
    .prepare(
      'INSERT INTO content_fields (id, content_type_id, field_key, label, type, required, repeatable, sort_order, settings_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    )
    .run(
      record.id,
      record.contentTypeId,
      record.key,
      record.label,
      record.type,
      record.required ? 1 : 0,
      record.repeatable ? 1 : 0,
      record.sortOrder,
      JSON.stringify(record.settings ?? {}),
    );
}

export function mapContentTypeRecord(
  row: ContentTypeRowView,
  fields: readonly ReturnType<typeof mapFieldRow>[],
): ContentTypeRecord {
  const realtimeEnabled = row.realtime_enabled === 1;

  return {
    displayName: row.display_name,
    fields,
    id: row.id,
    kind: row.kind as ContentTypeRecord['kind'],
    permissions: parsePermissions(row.permissions_json),
    realtimeActions: {
      create: readStoredRealtimeAction(row.realtime_create_enabled, realtimeEnabled),
      delete: readStoredRealtimeAction(row.realtime_delete_enabled, realtimeEnabled),
      update: readStoredRealtimeAction(row.realtime_update_enabled, realtimeEnabled),
    },
    realtimeEnabled,
    slug: row.slug,
  };
}

function addColumn(database: Database.Database, sql: string): void {
  try {
    database.prepare(sql).run();
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes('duplicate column name')) {
      throw error;
    }
  }
}

function readStoredRealtimeAction(value: number | null, fallback: boolean): boolean {
  return value === null ? fallback : value === 1;
}

function serializeDefaultPermissions(): string {
  return JSON.stringify(DEFAULT_CONTENT_TYPE_PERMISSIONS);
}

function parsePermissions(value: string | null): ContentTypeRecord['permissions'] {
  try {
    const parsed = value ? JSON.parse(value) : undefined;
    return normalizeContentTypePermissions(parsed);
  } catch {
    return normalizeContentTypePermissions(undefined);
  }
}
