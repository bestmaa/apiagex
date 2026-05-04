import { randomUUID } from 'node:crypto';

import Database from 'better-sqlite3';

import type {
  ContentEntryInput,
  ContentEntryRecord,
  ContentEntryVersionRecord,
} from './content-entries.routes.type.js';
import type { ContentEntryVersionRow } from './content-entry-versions.repository.type.js';
import type { ContentEntryRow } from './content-entries.repository.type.js';

export function createContentEntryVersionsSchema(): string {
  return [
    'CREATE TABLE IF NOT EXISTS content_entry_versions (',
    '  id TEXT PRIMARY KEY,',
    '  content_type_id TEXT NOT NULL,',
    '  entry_id TEXT NOT NULL,',
    "  status TEXT NOT NULL DEFAULT 'draft',",
    '  publish_at TEXT NULL,',
    "  data_json TEXT NOT NULL DEFAULT '{}',",
    '  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,',
    '  FOREIGN KEY (content_type_id) REFERENCES content_types(id) ON DELETE CASCADE,',
    '  FOREIGN KEY (entry_id) REFERENCES content_entries(id) ON DELETE CASCADE',
    ');',
  ].join('\n');
}

export function listContentEntryVersions(
  database: Database.Database,
  contentTypeId: string,
  entryId: string,
): readonly ContentEntryVersionRecord[] {
  const rows = database
    .prepare(
      'SELECT id, content_type_id, entry_id, status, publish_at, data_json, created_at FROM content_entry_versions WHERE content_type_id = ? AND entry_id = ? ORDER BY created_at DESC',
    )
    .all(contentTypeId, entryId) as ContentEntryVersionRow[];

  return rows.map(mapVersionRow);
}

export function saveContentEntryVersion(database: Database.Database, record: ContentEntryRecord): void {
  insertContentEntryVersion(database, {
    createdAt: new Date().toISOString(),
    contentTypeId: record.contentTypeId,
    data: record.data,
    entryId: record.id,
    id: randomUUID(),
    publishAt: record.publishAt,
    status: record.status,
  });
}

export function insertContentEntryVersion(
  database: Database.Database,
  record: ContentEntryVersionRecord,
): void {
  database
    .prepare(
      'INSERT INTO content_entry_versions (id, content_type_id, entry_id, status, publish_at, data_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    )
    .run(
      record.id,
      record.contentTypeId,
      record.entryId,
      record.status,
      record.publishAt,
      JSON.stringify(record.data),
      record.createdAt,
    );
}

export function restoreContentEntryVersion(
  database: Database.Database,
  contentTypeId: string,
  entryId: string,
  versionId: string,
): ContentEntryRecord | null {
  const version = database
    .prepare(
      'SELECT id, content_type_id, entry_id, status, publish_at, data_json, created_at FROM content_entry_versions WHERE content_type_id = ? AND entry_id = ? AND id = ?',
    )
    .get(contentTypeId, entryId, versionId) as ContentEntryVersionRow | undefined;
  const existing = database
    .prepare('SELECT id FROM content_entries WHERE content_type_id = ? AND id = ?')
    .get(contentTypeId, entryId) as ContentEntryRow | undefined;

  if (!version || !existing) {
    return null;
  }

  const record: ContentEntryRecord = {
    contentTypeId,
    data: JSON.parse(version.data_json) as Record<string, unknown>,
    id: entryId,
    publishAt: version.publish_at,
    status: version.status as ContentEntryRecord['status'],
  };

  database
    .prepare(
      'UPDATE content_entries SET status = ?, publish_at = ?, data_json = ?, updated_at = CURRENT_TIMESTAMP WHERE content_type_id = ? AND id = ?',
    )
    .run(record.status, record.publishAt, JSON.stringify(record.data), contentTypeId, entryId);

  saveContentEntryVersion(database, record);
  return record;
}

function mapVersionRow(row: ContentEntryVersionRow): ContentEntryVersionRecord {
  return {
    contentTypeId: row.content_type_id,
    createdAt: row.created_at,
    data: JSON.parse(row.data_json) as Record<string, unknown>,
    entryId: row.entry_id,
    id: row.id,
    publishAt: row.publish_at,
    status: row.status as ContentEntryVersionRecord['status'],
  };
}
