import Database from 'better-sqlite3';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildServer } from '../src/app.js';

describe('sqlite performance indexes', () => {
  it('creates indexes for hot paths', async () => {
    const databaseFile = join(await mkdtemp(join(tmpdir(), 'apiagex-indexes-')), 'content-types.db');
    const app = await buildServer({ contentTypesDatabaseFile: databaseFile, logger: false });

    await app.close();

    const database = new Database(databaseFile);
    const contentEntriesIndexes = listIndexes(database, 'content_entries');
    const contentFieldsIndexes = listIndexes(database, 'content_fields');
    const webhookDeliveriesIndexes = listIndexes(database, 'webhook_deliveries');

    database.close();

    expect(contentEntriesIndexes).toContain('idx_content_entries_content_type_publish_at');
    expect(contentEntriesIndexes).toContain('idx_content_entries_content_type_status_updated_at');
    expect(contentFieldsIndexes).toContain('idx_content_fields_content_type_sort_order');
    expect(webhookDeliveriesIndexes).toContain('idx_webhook_deliveries_status_next_retry_at');
  });
});

function listIndexes(database: Database.Database, tableName: string): string[] {
  const rows = database.prepare(`PRAGMA index_list('${tableName}')`).all() as Array<{ name: string }>;
  return rows.map((row) => row.name);
}
