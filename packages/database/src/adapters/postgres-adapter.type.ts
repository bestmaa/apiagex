import type { DatabaseAdapterDescriptor } from '../database.type.js';

export interface PostgresAdapter {
  descriptor: DatabaseAdapterDescriptor;
  makeUrl(connection: {
    host: string;
    name: string;
    password: string;
    port: number;
    user: string;
  }): string;
}
