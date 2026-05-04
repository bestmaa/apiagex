import type Database from 'better-sqlite3';

export function createWebhooksSchema(): string {
  return [
    'CREATE TABLE IF NOT EXISTS webhooks (',
    '  id TEXT PRIMARY KEY,',
    '  name TEXT NOT NULL,',
    '  target_url TEXT NOT NULL,',
    '  secret TEXT,',
    '  enabled INTEGER NOT NULL DEFAULT 1,',
    "  events_json TEXT NOT NULL DEFAULT '[]',",
    "  filters_json TEXT NOT NULL DEFAULT '{}',",
    '  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,',
    '  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP',
    ');',
    'CREATE TABLE IF NOT EXISTS webhook_deliveries (',
    '  id TEXT PRIMARY KEY,',
    '  webhook_id TEXT NOT NULL,',
    '  event_name TEXT NOT NULL,',
    '  request_body TEXT NOT NULL,',
    '  attempt INTEGER NOT NULL DEFAULT 1,',
    "  status TEXT NOT NULL DEFAULT 'pending',",
    '  status_code INTEGER,',
    '  response_body TEXT,',
    '  error_message TEXT,',
    '  next_retry_at TEXT,',
    '  delivered_at TEXT,',
    '  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,',
    '  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,',
    '  FOREIGN KEY (webhook_id) REFERENCES webhooks(id) ON DELETE CASCADE',
    ');',
  ].join('\n');
}

export function ensureWebhookColumns(database: Database.Database): void {
  const columns = new Set(
    (database.prepare("PRAGMA table_info('webhooks')").all() as Array<{ name: string }>).map((row) => row.name),
  );

  if (!columns.has('filters_json')) {
    addColumn(database, "ALTER TABLE webhooks ADD COLUMN filters_json TEXT NOT NULL DEFAULT '{}'");
  }
}

export function ensureWebhookDeliveryColumns(database: Database.Database): void {
  const columns = new Set(
    (database.prepare("PRAGMA table_info('webhook_deliveries')").all() as Array<{ name: string }>).map((row) => row.name),
  );

  if (!columns.has('attempt')) {
    addColumn(database, "ALTER TABLE webhook_deliveries ADD COLUMN attempt INTEGER NOT NULL DEFAULT 1");
  }

  if (!columns.has('status')) {
    addColumn(database, "ALTER TABLE webhook_deliveries ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'");
  }

  if (!columns.has('next_retry_at')) {
    addColumn(database, 'ALTER TABLE webhook_deliveries ADD COLUMN next_retry_at TEXT');
  }

  if (!columns.has('delivered_at')) {
    addColumn(database, 'ALTER TABLE webhook_deliveries ADD COLUMN delivered_at TEXT');
  }

  if (!columns.has('updated_at')) {
    addColumn(database, 'ALTER TABLE webhook_deliveries ADD COLUMN updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP');
  }
}

function addColumn(database: Database.Database, sql: string): void {
  try {
    database.prepare(sql).run();
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes('duplicate column name')) {
      throw error;
    }
  }
}
