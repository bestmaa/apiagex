import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

import Database from 'better-sqlite3';

import type {
  ContentEntryInput,
  ContentEntryRecord,
  ContentEntriesRepository,
  ContentEntryVersionRecord,
} from './content-entries.routes.type.js';
import type { ContentEntryRow } from './content-entries.repository.type.js';
import {
  createContentEntryVersionsSchema,
  insertContentEntryVersion,
  listContentEntryVersions,
  restoreContentEntryVersion,
  saveContentEntryVersion,
} from './content-entry-versions.repository.js';
import { recordSchemaMigration } from './schema-migrations.repository.js';

export function createSqliteContentEntriesRepository(databaseFile: string): ContentEntriesRepository {
  if (databaseFile !== ':memory:') {
    mkdirSync(dirname(databaseFile), { recursive: true });
  }

  const database = new Database(databaseFile);
  database.pragma('journal_mode = WAL');
  database.exec(createSchema());
  ensureContentEntryColumns(database);
  recordSchemaMigration(database, { name: '0001_content_entries_schema_v1', scope: 'content-entries' });

  return {
    clear() {
      database.transaction(() => {
        database.prepare('DELETE FROM content_entry_versions').run();
        database.prepare('DELETE FROM content_entries').run();
      })();
    },
    close() {
      database.close();
    },
    create(contentTypeId: string, input: ContentEntryInput): ContentEntryRecord | null {
      if (!hasContentType(database, contentTypeId)) {
        return null;
      }

      const record = makeRecord(contentTypeId, input);

      database
        .prepare(
          'INSERT INTO content_entries (id, content_type_id, status, publish_at, data_json) VALUES (?, ?, ?, ?, ?)',
        )
        .run(
          record.id,
          record.contentTypeId,
          record.status,
          record.publishAt,
          JSON.stringify(record.data),
        );
      saveContentEntryVersion(database, record);

      return record;
    },
    delete(contentTypeId: string, entryId: string): boolean {
      const result = database
        .prepare('DELETE FROM content_entries WHERE content_type_id = ? AND id = ?')
        .run(contentTypeId, entryId);

      return result.changes > 0;
    },
    get(contentTypeId: string, entryId: string): ContentEntryRecord | null {
      const row = getRow(database, contentTypeId, entryId);

      return row ? mapRow(row) : null;
    },
    list(contentTypeId: string): readonly ContentEntryRecord[] {
      const rows = database
        .prepare(
          'SELECT id, content_type_id, status, publish_at, data_json FROM content_entries WHERE content_type_id = ? ORDER BY rowid DESC',
        )
        .all(contentTypeId) as ContentEntryRow[];

      return rows.map(mapRow);
    },
    publishScheduled(beforeIso: string): readonly ContentEntryRecord[] {
      const rows = database
        .prepare(
          "SELECT id, content_type_id, status, publish_at, data_json FROM content_entries WHERE status = 'scheduled' AND publish_at IS NOT NULL AND publish_at <= ? ORDER BY publish_at ASC, rowid ASC",
        )
        .all(beforeIso) as ContentEntryRow[];

      if (!rows.length) {
        return [];
      }

      return database.transaction(() => {
        return rows.map((row) => {
          database
            .prepare(
              "UPDATE content_entries SET status = 'published', updated_at = CURRENT_TIMESTAMP WHERE content_type_id = ? AND id = ?",
            )
            .run(row.content_type_id, row.id);

          const record = mapRow({
            ...row,
            status: 'published',
          });

          saveContentEntryVersion(database, record);
          return record;
        });
      })();
    },
    listVersions(contentTypeId: string, entryId: string): readonly ContentEntryVersionRecord[] {
      return listContentEntryVersions(database, contentTypeId, entryId);
    },
    replaceAll(input) {
      database.transaction(() => {
        database.prepare('DELETE FROM content_entry_versions').run();
        database.prepare('DELETE FROM content_entries').run();

        for (const entry of input.entries) {
          database
            .prepare('INSERT INTO content_entries (id, content_type_id, status, publish_at, data_json) VALUES (?, ?, ?, ?, ?)')
            .run(entry.id, entry.contentTypeId, entry.status, entry.publishAt, JSON.stringify(entry.data));
        }

        for (const version of input.versions) {
          insertContentEntryVersion(database, version);
        }
      })();
    },
    restoreVersion(contentTypeId: string, entryId: string, versionId: string): ContentEntryRecord | null {
      return restoreContentEntryVersion(database, contentTypeId, entryId, versionId);
    },
    update(contentTypeId: string, entryId: string, input: ContentEntryInput): ContentEntryRecord | null {
      if (!getRow(database, contentTypeId, entryId)) {
        return null;
      }

      const record = makeRecord(contentTypeId, input, entryId);

      database
        .prepare(
          'UPDATE content_entries SET status = ?, publish_at = ?, data_json = ?, updated_at = CURRENT_TIMESTAMP WHERE content_type_id = ? AND id = ?',
        )
        .run(record.status, record.publishAt, JSON.stringify(record.data), contentTypeId, entryId);
      saveContentEntryVersion(database, record);

      return record;
    },
  };
}

function createSchema(): string {
  return [
    'CREATE TABLE IF NOT EXISTS content_entries (',
    '  id TEXT PRIMARY KEY,',
    '  content_type_id TEXT NOT NULL,',
    "  status TEXT NOT NULL DEFAULT 'draft',",
    '  publish_at TEXT NULL,',
    "  data_json TEXT NOT NULL DEFAULT '{}',",
    '  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,',
    '  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,',
    '  FOREIGN KEY (content_type_id) REFERENCES content_types(id) ON DELETE CASCADE',
    ');',
    createContentEntryVersionsSchema(),
  ].join('\n');
}

function ensureContentEntryColumns(database: Database.Database): void {
  const columns = database.prepare("PRAGMA table_info('content_entries')").all() as Array<{ name: string }>;

  if (!columns.some((column) => column.name === 'publish_at')) {
    addColumn(database, 'content_entries', 'publish_at', 'TEXT NULL');
  }
}

function addColumn(database: Database.Database, tableName: string, columnName: string, definition: string): void {
  try {
    database.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  } catch (error) {
    if (error instanceof Error && /duplicate column name/i.test(error.message)) {
      return;
    }

    throw error;
  }
}

function getRow(
  database: Database.Database,
  contentTypeId: string,
  entryId: string,
): ContentEntryRow | undefined {
  return database
    .prepare('SELECT id, content_type_id, status, publish_at, data_json FROM content_entries WHERE content_type_id = ? AND id = ?')
    .get(contentTypeId, entryId) as ContentEntryRow | undefined;
}

function hasContentType(database: Database.Database, contentTypeId: string): boolean {
  return Boolean(database.prepare('SELECT 1 FROM content_types WHERE id = ?').get(contentTypeId));
}

function mapRow(row: ContentEntryRow): ContentEntryRecord {
  return {
    contentTypeId: row.content_type_id,
    data: JSON.parse(row.data_json) as Record<string, unknown>,
    id: row.id,
    publishAt: row.publish_at,
    status: row.status as ContentEntryRecord['status'],
  };
}

function makeRecord(
  contentTypeId: string,
  input: ContentEntryInput,
  id: string = randomUUID(),
): ContentEntryRecord {
  const publishAt = normalizePublishAt(input.publishAt);

  return {
    contentTypeId,
    data: input.data,
    id,
    publishAt,
    status: input.status ?? 'draft',
  };
}

function normalizePublishAt(value: string | null | undefined): string | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  return value;
}
