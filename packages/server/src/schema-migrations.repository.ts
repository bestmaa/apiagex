import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

import Database from 'better-sqlite3';

import type {
  SchemaMigrationInput,
  SchemaMigrationRecord,
  SchemaMigrationsRepository,
} from './schema-migrations.repository.type.js';

export function ensureSchemaMigrationsSchema(database: Database.Database): void {
  database.exec(createSchema());
}

export function recordSchemaMigration(
  database: Database.Database,
  input: SchemaMigrationInput,
): SchemaMigrationRecord {
  ensureSchemaMigrationsSchema(database);

  const record: SchemaMigrationRecord = {
    appliedAt: input.appliedAt ?? new Date().toISOString(),
    name: input.name,
    scope: input.scope,
  };

  database.prepare('INSERT OR IGNORE INTO schema_migrations (id, scope, name, applied_at) VALUES (?, ?, ?, ?)').run(
    randomUUID(),
    record.scope,
    record.name,
    record.appliedAt,
  );

  return record;
}

export function createSqliteSchemaMigrationsRepository(databaseFile: string): SchemaMigrationsRepository {
  if (databaseFile !== ':memory:') {
    mkdirSync(dirname(databaseFile), { recursive: true });
  }

  const database = new Database(databaseFile);
  database.pragma('journal_mode = WAL');
  database.exec(createSchema());

  return {
    clear() {
      database.prepare('DELETE FROM schema_migrations').run();
    },
    close() {
      database.close();
    },
    list() {
      const rows = database
        .prepare('SELECT scope, name, applied_at FROM schema_migrations ORDER BY applied_at DESC, name DESC')
        .all() as Array<{ applied_at: string; name: string; scope: string }>;

      return rows.map((row) => ({
        appliedAt: row.applied_at,
        name: row.name,
        scope: row.scope,
      }));
    },
    record(input: SchemaMigrationInput) {
      return recordSchemaMigration(database, input);
    },
    replaceAll(records) {
      database.transaction(() => {
        database.prepare('DELETE FROM schema_migrations').run();
        for (const record of records) {
          database.prepare('INSERT INTO schema_migrations (id, scope, name, applied_at) VALUES (?, ?, ?, ?)').run(
            randomUUID(),
            record.scope,
            record.name,
            record.appliedAt,
          );
        }
      })();
    },
  };
}

function createSchema(): string {
  return [
    'CREATE TABLE IF NOT EXISTS schema_migrations (',
    '  id TEXT PRIMARY KEY,',
    '  scope TEXT NOT NULL,',
    '  name TEXT NOT NULL,',
    '  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,',
    '  UNIQUE(scope, name)',
    ');',
  ].join('\n');
}
