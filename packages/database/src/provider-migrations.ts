import type { DatabaseProvider } from "./database-adapter.type.js";
import type { ApiagexDatabase } from "./database-adapter.type.js";
import { MVP_FOUNDATION_SQL, MVP_TABLES } from "./migrations.js";
import { MVP_MIGRATION_ID } from "./migrations.js";
import type { MvpTableName } from "./schema.type.js";

export type ProviderFoundationMigration = {
  provider: DatabaseProvider;
  foundationSql: string;
  tables: readonly MvpTableName[];
};

export function getProviderFoundationMigration(provider: DatabaseProvider): ProviderFoundationMigration {
  return {
    provider,
    foundationSql: providerFoundationSql(provider),
    tables: MVP_TABLES,
  };
}

export function providerFoundationSql(provider: DatabaseProvider): string {
  if (provider === "sqlite") return MVP_FOUNDATION_SQL;
  if (provider === "postgres") return POSTGRES_FOUNDATION_SQL;
  return MYSQL_FOUNDATION_SQL;
}

export async function migrateProviderFoundation(
  db: ApiagexDatabase,
  provider: DatabaseProvider,
): Promise<void> {
  await db.exec(providerFoundationSql(provider));
  const existing = await db.prepare("SELECT id, applied_at FROM migrations WHERE id = ?")
    .get<{ id: string; applied_at: string }>(MVP_MIGRATION_ID);
  if (!existing) {
    await db.prepare("INSERT INTO migrations (id, applied_at) VALUES (?, ?)")
      .run(MVP_MIGRATION_ID, new Date().toISOString());
  }
}

export const POSTGRES_FOUNDATION_SQL = `
CREATE TABLE IF NOT EXISTS migrations (
  id TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  is_owner INTEGER NOT NULL DEFAULT 0,
  role_kind TEXT NOT NULL DEFAULT 'api',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS schemas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS fields (
  id TEXT PRIMARY KEY,
  schema_id TEXT NOT NULL REFERENCES schemas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  type TEXT NOT NULL,
  relation_schema_id TEXT REFERENCES schemas(id),
  relation_type TEXT,
  required INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL,
  UNIQUE(schema_id, slug)
);

CREATE TABLE IF NOT EXISTS entries (
  id TEXT PRIMARY KEY,
  schema_id TEXT NOT NULL REFERENCES schemas(id) ON DELETE CASCADE,
  data_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY,
  role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  schema_id TEXT NOT NULL REFERENCES schemas(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  allowed INTEGER NOT NULL DEFAULT 0,
  UNIQUE(role_id, schema_id, action)
);

CREATE TABLE IF NOT EXISTS admin_permissions (
  id TEXT PRIMARY KEY,
  role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  allowed INTEGER NOT NULL DEFAULT 0,
  UNIQUE(role_id, action)
);

CREATE TABLE IF NOT EXISTS api_tokens (
  id TEXT PRIMARY KEY,
  role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  token_prefix TEXT NOT NULL,
  created_at TEXT NOT NULL,
  last_used_at TEXT,
  revoked_at TEXT
);

CREATE TABLE IF NOT EXISTS webhooks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  events_json TEXT NOT NULL,
  schema_id TEXT REFERENCES schemas(id) ON DELETE SET NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  schema_id TEXT NOT NULL REFERENCES schemas(id) ON DELETE CASCADE,
  schema_slug TEXT NOT NULL,
  entry_id TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  next_retry_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES webhook_events(id) ON DELETE CASCADE,
  webhook_id TEXT NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  status TEXT NOT NULL,
  status_code INTEGER,
  response_body TEXT,
  error TEXT,
  attempt INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  next_retry_at TEXT
);

CREATE TABLE IF NOT EXISTS realtime_configs (
  schema_id TEXT PRIMARY KEY REFERENCES schemas(id) ON DELETE CASCADE,
  enabled INTEGER NOT NULL DEFAULT 0,
  events_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS realtime_events (
  sequence BIGSERIAL PRIMARY KEY,
  id TEXT NOT NULL UNIQUE,
  message_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  schema_id TEXT NOT NULL REFERENCES schemas(id) ON DELETE CASCADE,
  schema_slug TEXT NOT NULL,
  entry_id TEXT NOT NULL,
  entry_json TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS realtime_sessions (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  token_prefix TEXT NOT NULL,
  role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  schema_id TEXT NOT NULL REFERENCES schemas(id) ON DELETE CASCADE,
  schema_slug TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT
);
`;

export const MYSQL_FOUNDATION_SQL = `
CREATE TABLE IF NOT EXISTS migrations (id VARCHAR(191) PRIMARY KEY, applied_at TEXT NOT NULL) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS roles (id VARCHAR(191) PRIMARY KEY, name VARCHAR(191) NOT NULL UNIQUE, description LONGTEXT NOT NULL, is_owner TINYINT(1) NOT NULL DEFAULT 0, role_kind VARCHAR(32) NOT NULL DEFAULT 'api', created_at TEXT NOT NULL, updated_at TEXT NOT NULL) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS users (id VARCHAR(191) PRIMARY KEY, email VARCHAR(191) NOT NULL UNIQUE, password_hash VARCHAR(191) NOT NULL, role_id VARCHAR(191) NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS schemas (id VARCHAR(191) PRIMARY KEY, name VARCHAR(191) NOT NULL, slug VARCHAR(191) NOT NULL UNIQUE, description LONGTEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS fields (id VARCHAR(191) PRIMARY KEY, schema_id VARCHAR(191) NOT NULL, name VARCHAR(191) NOT NULL, slug VARCHAR(191) NOT NULL, type VARCHAR(64) NOT NULL, relation_schema_id VARCHAR(191), relation_type VARCHAR(64), required TINYINT(1) NOT NULL DEFAULT 0, position INTEGER NOT NULL, UNIQUE(schema_id, slug), CONSTRAINT fk_fields_schema FOREIGN KEY (schema_id) REFERENCES schemas(id) ON DELETE CASCADE, CONSTRAINT fk_fields_relation_schema FOREIGN KEY (relation_schema_id) REFERENCES schemas(id)) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS entries (id VARCHAR(191) PRIMARY KEY, schema_id VARCHAR(191) NOT NULL, data_json LONGTEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, CONSTRAINT fk_entries_schema FOREIGN KEY (schema_id) REFERENCES schemas(id) ON DELETE CASCADE) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS permissions (id VARCHAR(191) PRIMARY KEY, role_id VARCHAR(191) NOT NULL, schema_id VARCHAR(191) NOT NULL, action VARCHAR(64) NOT NULL, allowed TINYINT(1) NOT NULL DEFAULT 0, UNIQUE(role_id, schema_id, action), CONSTRAINT fk_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE, CONSTRAINT fk_permissions_schema FOREIGN KEY (schema_id) REFERENCES schemas(id) ON DELETE CASCADE) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS admin_permissions (id VARCHAR(191) PRIMARY KEY, role_id VARCHAR(191) NOT NULL, action VARCHAR(64) NOT NULL, allowed TINYINT(1) NOT NULL DEFAULT 0, UNIQUE(role_id, action), CONSTRAINT fk_admin_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS api_tokens (id VARCHAR(191) PRIMARY KEY, role_id VARCHAR(191) NOT NULL, name VARCHAR(191) NOT NULL, token_hash VARCHAR(191) NOT NULL UNIQUE, token_prefix VARCHAR(32) NOT NULL, created_at TEXT NOT NULL, last_used_at TEXT, revoked_at TEXT, CONSTRAINT fk_api_tokens_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS webhooks (id VARCHAR(191) PRIMARY KEY, name VARCHAR(191) NOT NULL, url TEXT NOT NULL, secret VARCHAR(191) NOT NULL, events_json LONGTEXT NOT NULL, schema_id VARCHAR(191), active TINYINT(1) NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, CONSTRAINT fk_webhooks_schema FOREIGN KEY (schema_id) REFERENCES schemas(id) ON DELETE SET NULL) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS webhook_events (id VARCHAR(191) PRIMARY KEY, event_type VARCHAR(64) NOT NULL, schema_id VARCHAR(191) NOT NULL, schema_slug VARCHAR(191) NOT NULL, entry_id VARCHAR(191) NOT NULL, payload_json LONGTEXT NOT NULL, status VARCHAR(64) NOT NULL DEFAULT 'pending', attempts INTEGER NOT NULL DEFAULT 0, next_retry_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, CONSTRAINT fk_webhook_events_schema FOREIGN KEY (schema_id) REFERENCES schemas(id) ON DELETE CASCADE) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS webhook_deliveries (id VARCHAR(191) PRIMARY KEY, event_id VARCHAR(191) NOT NULL, webhook_id VARCHAR(191) NOT NULL, url TEXT NOT NULL, status VARCHAR(64) NOT NULL, status_code INTEGER, response_body LONGTEXT, error LONGTEXT, attempt INTEGER NOT NULL, created_at TEXT NOT NULL, next_retry_at TEXT, CONSTRAINT fk_webhook_deliveries_event FOREIGN KEY (event_id) REFERENCES webhook_events(id) ON DELETE CASCADE, CONSTRAINT fk_webhook_deliveries_webhook FOREIGN KEY (webhook_id) REFERENCES webhooks(id) ON DELETE CASCADE) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS realtime_configs (schema_id VARCHAR(191) PRIMARY KEY, enabled TINYINT(1) NOT NULL DEFAULT 0, events_json LONGTEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, CONSTRAINT fk_realtime_configs_schema FOREIGN KEY (schema_id) REFERENCES schemas(id) ON DELETE CASCADE) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS realtime_events (sequence BIGINT AUTO_INCREMENT PRIMARY KEY, id VARCHAR(191) NOT NULL UNIQUE, message_id VARCHAR(191) NOT NULL UNIQUE, event_type VARCHAR(64) NOT NULL, schema_id VARCHAR(191) NOT NULL, schema_slug VARCHAR(191) NOT NULL, entry_id VARCHAR(191) NOT NULL, entry_json LONGTEXT NOT NULL, occurred_at TEXT NOT NULL, created_at TEXT NOT NULL, CONSTRAINT fk_realtime_events_schema FOREIGN KEY (schema_id) REFERENCES schemas(id) ON DELETE CASCADE) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS realtime_sessions (id VARCHAR(191) PRIMARY KEY, token_hash VARCHAR(191) NOT NULL UNIQUE, token_prefix VARCHAR(32) NOT NULL, role_id VARCHAR(191) NOT NULL, schema_id VARCHAR(191) NOT NULL, schema_slug VARCHAR(191) NOT NULL, created_at TEXT NOT NULL, expires_at TEXT NOT NULL, used_at TEXT, CONSTRAINT fk_realtime_sessions_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE, CONSTRAINT fk_realtime_sessions_schema FOREIGN KEY (schema_id) REFERENCES schemas(id) ON DELETE CASCADE) ENGINE=InnoDB;
`;
