import Database from 'better-sqlite3';

import type { PerformanceIndexDefinition } from './sqlite-performance-indexes.type.js';

const INDEXES: readonly PerformanceIndexDefinition[] = [
  { name: 'idx_audit_logs_created_at', sql: 'CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC, id DESC)' },
  { name: 'idx_content_entries_content_type_publish_at', sql: 'CREATE INDEX IF NOT EXISTS idx_content_entries_content_type_publish_at ON content_entries(content_type_id, publish_at)' },
  { name: 'idx_content_entries_content_type_status_updated_at', sql: 'CREATE INDEX IF NOT EXISTS idx_content_entries_content_type_status_updated_at ON content_entries(content_type_id, status, updated_at DESC)' },
  { name: 'idx_content_entry_versions_content_entry_created_at', sql: 'CREATE INDEX IF NOT EXISTS idx_content_entry_versions_content_entry_created_at ON content_entry_versions(content_type_id, entry_id, created_at DESC)' },
  { name: 'idx_content_fields_content_type_sort_order', sql: 'CREATE INDEX IF NOT EXISTS idx_content_fields_content_type_sort_order ON content_fields(content_type_id, sort_order)' },
  { name: 'idx_content_types_display_name', sql: 'CREATE INDEX IF NOT EXISTS idx_content_types_display_name ON content_types(display_name)' },
  { name: 'idx_media_files_created_at', sql: 'CREATE INDEX IF NOT EXISTS idx_media_files_created_at ON media_files(created_at DESC)' },
  { name: 'idx_schema_migrations_applied_at', sql: 'CREATE INDEX IF NOT EXISTS idx_schema_migrations_applied_at ON schema_migrations(applied_at DESC)' },
  { name: 'idx_webhook_deliveries_status_next_retry_at', sql: "CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status_next_retry_at ON webhook_deliveries(status, next_retry_at)" },
  { name: 'idx_webhook_deliveries_webhook_created_at', sql: 'CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_created_at ON webhook_deliveries(webhook_id, created_at DESC)' },
  { name: 'idx_webhooks_enabled_created_at', sql: 'CREATE INDEX IF NOT EXISTS idx_webhooks_enabled_created_at ON webhooks(enabled, created_at DESC)' },
];

export function ensureSqlitePerformanceIndexes(databaseFile: string): void {
  if (databaseFile === ':memory:') {
    return;
  }

  const database = new Database(databaseFile);
  database.pragma('journal_mode = WAL');

  try {
    for (const index of INDEXES) {
      database.exec(index.sql);
    }
  } finally {
    database.close();
  }
}
