import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

import Database from 'better-sqlite3';

import { makeMediaFileRecord, mapMediaFileRow } from './media.repository.helpers.js';
import { recordSchemaMigration } from './schema-migrations.repository.js';
import type {
  MediaFileInput,
  MediaFileRecord,
  MediaFilesRepository,
  MediaFileRow,
} from './media.repository.type.js';

export function createSqliteMediaFilesRepository(databaseFile: string): MediaFilesRepository {
  if (databaseFile !== ':memory:') {
    mkdirSync(dirname(databaseFile), { recursive: true });
  }

  const database = new Database(databaseFile);
  database.pragma('journal_mode = WAL');
  database.exec(createSchema());
  recordSchemaMigration(database, { name: '0001_media_schema_v1', scope: 'media-files' });

  return {
    clear() {
      database.prepare('DELETE FROM media_files').run();
    },
    close() {
      database.close();
    },
    create(input: MediaFileInput): MediaFileRecord {
      const record = makeMediaFileRecord(input);

      database
        .prepare(
          'INSERT INTO media_files (id, filename, mime_type, size, storage_path, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        )
        .run(
          record.id,
          record.filename,
          record.mimeType,
          record.size,
          record.storagePath,
          record.createdAt,
          record.updatedAt,
        );

      return record;
    },
    get(id: string): MediaFileRecord | null {
      const row = database
        .prepare(
          'SELECT id, filename, mime_type, size, storage_path, created_at, updated_at FROM media_files WHERE id = ?',
        )
        .get(id) as MediaFileRow | undefined;

      return row ? mapMediaFileRow(row) : null;
    },
    list(): readonly MediaFileRecord[] {
      const rows = database
        .prepare(
          'SELECT id, filename, mime_type, size, storage_path, created_at, updated_at FROM media_files ORDER BY created_at DESC',
        )
        .all() as MediaFileRow[];

      return rows.map(mapMediaFileRow);
    },
    replaceAll(records) {
      database.transaction(() => {
        database.prepare('DELETE FROM media_files').run();

        for (const record of records) {
          database
            .prepare(
              'INSERT INTO media_files (id, filename, mime_type, size, storage_path, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            )
            .run(
              record.id,
              record.filename,
              record.mimeType,
              record.size,
              record.storagePath,
              record.createdAt,
              record.updatedAt,
            );
        }
      })();
    },
  };
}

function createSchema(): string {
  return [
    'CREATE TABLE IF NOT EXISTS media_files (',
    '  id TEXT PRIMARY KEY,',
    '  filename TEXT NOT NULL,',
    '  mime_type TEXT NOT NULL,',
    '  size INTEGER NOT NULL DEFAULT 0,',
    '  storage_path TEXT NOT NULL UNIQUE,',
    '  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,',
    '  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP',
    ');',
  ].join('\n');
}
