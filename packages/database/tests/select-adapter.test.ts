import { describe, expect, it } from 'vitest';

import {
  createMysqlAdapter,
  createPostgresAdapter,
  createSqliteAdapter,
  selectDatabaseAdapter,
} from '../src/index.js';

describe('database adapters', () => {
  it('selects sqlite adapter metadata', () => {
    const result = selectDatabaseAdapter({ client: 'sqlite', file: './data/apiagex.db' });

    expect(result.descriptor).toEqual(createSqliteAdapter().descriptor);
  });

  it('selects postgres adapter metadata', () => {
    const result = selectDatabaseAdapter({
      client: 'postgres',
      host: '127.0.0.1',
      name: 'apiagex',
      password: 'secret',
      port: 5432,
      user: 'postgres',
    });

    expect(result.descriptor).toEqual(createPostgresAdapter().descriptor);
  });

  it('selects mysql adapter metadata', () => {
    const result = selectDatabaseAdapter({
      client: 'mysql',
      host: '127.0.0.1',
      name: 'apiagex',
      password: 'secret',
      port: 3306,
      user: 'root',
    });

    expect(result.descriptor).toEqual(createMysqlAdapter().descriptor);
  });
});
