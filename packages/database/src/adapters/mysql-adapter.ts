import type { MysqlAdapter } from './mysql-adapter.type.js';

export function createMysqlAdapter(): MysqlAdapter {
  return {
    descriptor: {
      client: 'mysql',
      description: 'Relational database for teams already on MySQL.',
      displayName: 'MySQL',
    },
    makeUrl(connection): string {
      const auth = `${encodeURIComponent(connection.user)}:${encodeURIComponent(connection.password)}`;
      return `mysql://${auth}@${connection.host}:${connection.port}/${connection.name}`;
    },
  };
}
