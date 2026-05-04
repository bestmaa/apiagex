import { createMysqlAdapter } from './adapters/mysql-adapter.js';
import { createPostgresAdapter } from './adapters/postgres-adapter.js';
import { createSqliteAdapter } from './adapters/sqlite-adapter.js';
import type { DatabaseAdapterSelection, DatabaseConnectionConfig } from './database.type.js';

export function selectDatabaseAdapter(
  config: DatabaseConnectionConfig,
): DatabaseAdapterSelection {
  if (config.client === 'sqlite') {
    return {
      config,
      descriptor: createSqliteAdapter().descriptor,
    };
  }

  if (config.client === 'postgres') {
    return {
      config,
      descriptor: createPostgresAdapter().descriptor,
    };
  }

  return {
    config,
    descriptor: createMysqlAdapter().descriptor,
  };
}
