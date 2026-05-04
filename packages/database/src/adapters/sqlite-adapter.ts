import type { SqliteAdapter } from './sqlite-adapter.type.js';

export function createSqliteAdapter(): SqliteAdapter {
  return {
    descriptor: {
      client: 'sqlite',
      description: 'Local file database for development and simple deployments.',
      displayName: 'SQLite',
    },
    makeUrl(filePath: string): string {
      return filePath;
    },
  };
}
