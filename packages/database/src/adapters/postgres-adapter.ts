import type { PostgresAdapter } from './postgres-adapter.type.js';

export function createPostgresAdapter(): PostgresAdapter {
  return {
    descriptor: {
      client: 'postgres',
      description: 'Relational database for production and multi-tenant workloads.',
      displayName: 'PostgreSQL',
    },
    makeUrl(connection): string {
      const auth = `${encodeURIComponent(connection.user)}:${encodeURIComponent(connection.password)}`;
      return `postgres://${auth}@${connection.host}:${connection.port}/${connection.name}`;
    },
  };
}
