import type { DatabaseAdapterDescriptor } from '../database.type.js';

export interface SqliteAdapter {
  descriptor: DatabaseAdapterDescriptor;
  makeUrl(filePath: string): string;
}
