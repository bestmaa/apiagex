import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

import Database from 'better-sqlite3';

import { makeContentTypeRecord, makeFieldRecord, mapFieldRow } from './content-types.repository.helpers.js';
import {
  createSchema,
  ensureContentTypeColumns,
  getContentTypeRow,
  listContentFieldRows,
  listContentTypeRows,
  mapContentTypeRecord,
  saveContentField,
  saveContentFields,
  saveContentType,
} from './content-types.repository.sql.js';
import type {
  ContentTypeInput,
  ContentTypeRecord,
  ContentTypesRepository,
} from './content-types.repository.type.js';
import type { ContentFieldRecord, ContentTypeFieldInput } from './content-types.routes.type.js';
import { recordSchemaMigration } from './schema-migrations.repository.js';

export function createSqliteContentTypesRepository(databaseFile: string): ContentTypesRepository {
  if (databaseFile !== ':memory:') {
    mkdirSync(dirname(databaseFile), { recursive: true });
  }

  const database = new Database(databaseFile);
  database.pragma('journal_mode = WAL');
  database.pragma('foreign_keys = ON');
  database.exec(createSchema());
  ensureContentTypeColumns(database);
  recordSchemaMigration(database, { name: '0001_content_types_schema_v1', scope: 'content-types' });

  const contentTypeCache = new Map<string, ContentTypeRecord>();
  const contentFieldCache = new Map<string, ReturnType<typeof mapFieldRow>>();
  const contentFieldListCache = new Map<string, readonly ReturnType<typeof mapFieldRow>[]>();
  let contentTypeListCache: readonly ContentTypeRecord[] | null = null;

  return {
    clear() {
      database.transaction(() => {
        database.prepare('DELETE FROM content_fields').run();
        database.prepare('DELETE FROM content_types').run();
      })();
      invalidateAll();
    },
    close() {
      database.close();
    },
    create(input: ContentTypeInput): ContentTypeRecord {
      const record = makeContentTypeRecord(input);

      database.transaction(() => {
        saveContentType(database, record);
        saveContentFields(database, record);
      })();

      invalidateAll();
      return record;
    },
    createField(contentTypeId: string, input: ContentTypeFieldInput) {
      if (!getContentTypeRow(database, contentTypeId)) {
        return null;
      }

      const record = makeFieldRecord(contentTypeId, input);

      database.transaction(() => {
        saveContentField(database, record);
      })();

      invalidateContentType(contentTypeId);
      return record;
    },
    delete(id: string): boolean {
      const deleted = database.transaction(() => {
        const result = database.prepare('DELETE FROM content_types WHERE id = ?').run(id);

        if (result.changes > 0) {
          database.prepare('DELETE FROM content_fields WHERE content_type_id = ?').run(id);
        }

        return result.changes > 0;
      })();

      if (deleted) {
        invalidateAll();
      }

      return deleted;
    },
    deleteField(contentTypeId: string, fieldKey: string): boolean {
      const deleted = database.transaction(() => {
        const result = database
          .prepare('DELETE FROM content_fields WHERE content_type_id = ? AND field_key = ?')
          .run(contentTypeId, fieldKey);

        return result.changes > 0;
      })();

      if (deleted) {
        invalidateContentType(contentTypeId);
      }

      return deleted;
    },
    get(id: string): ContentTypeRecord | null {
      return loadContentTypeRecord(id);
    },
    getField(contentTypeId: string, fieldKey: string): ContentFieldRecord | null {
      const cacheKey = `${contentTypeId}:${fieldKey}`;
      const cached = contentFieldCache.get(cacheKey);
      if (cached) {
        return cached;
      }

      const record = listFields(contentTypeId).find((field) => field.key === fieldKey) ?? null;
      if (record) {
        contentFieldCache.set(cacheKey, record);
      }

      return record;
    },
    list(): readonly ContentTypeRecord[] {
      if (contentTypeListCache) {
        return contentTypeListCache;
      }

      const records = listContentTypeRows(database)
        .map((row) => loadContentTypeRecord(row.id))
        .filter((record): record is ContentTypeRecord => record !== null);

      contentTypeListCache = records;
      return records;
    },
    listFields(contentTypeId: string): readonly ContentFieldRecord[] {
      return listFields(contentTypeId);
    },
    replaceAll(records: readonly ContentTypeRecord[]): void {
      database.transaction(() => {
        database.prepare('DELETE FROM content_fields').run();
        database.prepare('DELETE FROM content_types').run();

        for (const record of records) {
          saveContentType(database, record);
          saveContentFields(database, record);
        }
      })();

      invalidateAll();
    },
    update(id: string, input: ContentTypeInput): ContentTypeRecord | null {
      if (!getContentTypeRow(database, id)) {
        return null;
      }

      const record = makeContentTypeRecord(input);

      database.transaction(() => {
        database.prepare('DELETE FROM content_types WHERE id = ?').run(id);
        database.prepare('DELETE FROM content_fields WHERE content_type_id = ?').run(id);
        saveContentType(database, record);
        saveContentFields(database, record);
      })();

      invalidateAll();
      return record;
    },
    updateField(contentTypeId: string, fieldKey: string, input: ContentTypeFieldInput) {
      if (!database.prepare('SELECT 1 FROM content_fields WHERE content_type_id = ? AND field_key = ?').get(contentTypeId, fieldKey)) {
        return null;
      }

      const record = makeFieldRecord(contentTypeId, input);

      database.transaction(() => {
        database
          .prepare('DELETE FROM content_fields WHERE content_type_id = ? AND field_key = ?')
          .run(contentTypeId, fieldKey);
        saveContentField(database, record);
      })();

      invalidateContentType(contentTypeId);
      return record;
    },
  };

  function loadContentTypeRecord(id: string): ContentTypeRecord | null {
    const cached = contentTypeCache.get(id);
    if (cached) {
      return cached;
    }

    const row = getContentTypeRow(database, id);
    if (!row) {
      return null;
    }

    const record = mapContentTypeRecord(row, listFields(id));
    contentTypeCache.set(id, record);
    return record;
  }

  function listFields(contentTypeId: string): readonly ReturnType<typeof mapFieldRow>[] {
    const cached = contentFieldListCache.get(contentTypeId);
    if (cached) {
      return cached;
    }

    const records = listContentFieldRows(database, contentTypeId).map((row) => {
      const record = mapFieldRow(row);
      contentFieldCache.set(record.id, record);
      return record;
    });

    contentFieldListCache.set(contentTypeId, records);
    return records;
  }

  function invalidateAll(): void {
    contentTypeCache.clear();
    contentFieldCache.clear();
    contentFieldListCache.clear();
    contentTypeListCache = null;
  }

  function invalidateContentType(contentTypeId: string): void {
    contentTypeCache.delete(contentTypeId);
    contentFieldListCache.delete(contentTypeId);
    contentTypeListCache = null;

    for (const key of contentFieldCache.keys()) {
      if (key.startsWith(`${contentTypeId}:`)) {
        contentFieldCache.delete(key);
      }
    }
  }
}
