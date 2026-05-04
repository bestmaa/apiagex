import type { StarterTemplate } from './starter-template.type.js';

export function createSQLiteFiles(): StarterTemplate[] {
  return [createDatabaseType(), createDatabase()];
}

function createDatabaseType(): StarterTemplate {
  return {
    content: [
      'export interface StarterDatabaseConnection {',
      "  client: 'sqlite';",
      '  execute(sql: string): void;',
      '  close(): void;',
      '  filePath: string;',
      '}',
      '',
    ].join('\n'),
    path: 'src/database.type.ts',
  };
}

function createDatabase(): StarterTemplate {
  return {
    content: [
      "import { mkdir } from 'node:fs/promises';",
      "import { dirname } from 'node:path';",
      "import Database from 'better-sqlite3';",
      '',
      "import type { StarterServerConfig } from './config.type.js';",
      "import type { StarterDatabaseConnection } from './database.type.js';",
      '',
      'export async function openDatabase(',
      '  config: StarterServerConfig,',
      '): Promise<StarterDatabaseConnection | null> {',
      "  if (config.databaseClient !== 'sqlite') {",
      '    return null;',
      '  }',
      '',
      "  if (config.databaseUrl !== ':memory:') {",
      '    await mkdir(dirname(config.databaseUrl), { recursive: true });',
      '  }',
      '',
      '  const database = new Database(config.databaseUrl);',
      "  database.pragma('journal_mode = WAL');",
      '',
      '  return {',
      "    client: 'sqlite',",
      '    execute: (sql: string) => {',
      '      database.exec(sql);',
      '    },',
      '    close: () => database.close(),',
      '    filePath: config.databaseUrl,',
      '  };',
      '}',
      '',
    ].join('\n'),
    path: 'src/database.ts',
  };
}
