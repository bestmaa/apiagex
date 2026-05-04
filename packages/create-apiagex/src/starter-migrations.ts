import type { StarterTemplate } from './starter-template.type.js';

export function createMigrationFiles(): StarterTemplate[] {
  return [createMigrationTypeTs(), createMigrationsTs(), createMigrateTs()];
}

function createMigrationTypeTs(): StarterTemplate {
  return {
    content: [
      'export interface StarterMigration {',
      '  name: string;',
      '  statements: readonly string[];',
      '}',
      '',
    ].join('\n'),
    path: 'src/migrations.type.ts',
  };
}

function createMigrationsTs(): StarterTemplate {
  return {
    content: [
      "import type { StarterMigration } from './migrations.type.js';",
      "import { starterContentTypeMigrationStatements } from './content-types.js';",
      '',
      'export const starterMigrations: readonly StarterMigration[] = [',
      '  {',
      "    name: '0001_bootstrap_system_tables',",
      '    statements: [',
      "      'CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)',",
      "      'CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)',",
      '      ...starterContentTypeMigrationStatements,',
      '    ],',
      '  },',
      '];',
      '',
    ].join('\n'),
    path: 'src/migrations.ts',
  };
}

function createMigrateTs(): StarterTemplate {
  return {
    content: [
      "import type { StarterDatabaseConnection } from './database.type.js';",
      "import { starterMigrations } from './migrations.js';",
      '',
      'export async function runMigrations(database: StarterDatabaseConnection): Promise<void> {',
      "  database.execute('BEGIN');",
      '',
      '  try {',
      '    for (const migration of starterMigrations) {',
      '      for (const statement of migration.statements) {',
      '        database.execute(statement);',
      '      }',
      '',
      "      database.execute('INSERT OR IGNORE INTO _migrations (name) VALUES (' + JSON.stringify(migration.name) + ')');",
      '    }',
      '',
      "    database.execute('COMMIT');",
      '  } catch (error) {',
      "    database.execute('ROLLBACK');",
      '    throw error;',
      '  }',
      '}',
      '',
    ].join('\n'),
    path: 'src/migrate.ts',
  };
}
