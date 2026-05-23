import type { ApiagexDatabase, DatabaseProvider } from "./database-adapter.type.js";

export const PLATFORM_MIGRATION_ID = "001_platform_tenant_registry";

export const PLATFORM_TABLES = [
  "platform_migrations",
  "tenants",
  "tenant_domains",
  "tenant_audit_events",
] as const;

export type PlatformTableName = typeof PLATFORM_TABLES[number];

export async function migratePlatformDatabase(db: ApiagexDatabase): Promise<void> {
  await db.exec(platformFoundationSql(db.provider));
  const existing = await db.prepare("SELECT id, applied_at FROM platform_migrations WHERE id = ?")
    .get<{ id: string; applied_at: string }>(PLATFORM_MIGRATION_ID);
  if (!existing) {
    await db.prepare("INSERT INTO platform_migrations (id, applied_at) VALUES (?, ?)")
      .run(PLATFORM_MIGRATION_ID, new Date().toISOString());
  }
}

export function platformFoundationSql(provider: DatabaseProvider): string {
  if (provider === "postgres") return POSTGRES_PLATFORM_FOUNDATION_SQL;
  if (provider === "mysql") return MYSQL_PLATFORM_FOUNDATION_SQL;
  return SQLITE_PLATFORM_FOUNDATION_SQL;
}

export const SQLITE_PLATFORM_FOUNDATION_SQL = `
CREATE TABLE IF NOT EXISTS platform_migrations (
  id TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL,
  database_provider TEXT NOT NULL,
  database_url_encrypted_json TEXT NOT NULL,
  uploads_path TEXT NOT NULL,
  subdomain TEXT UNIQUE,
  primary_domain TEXT UNIQUE,
  plan TEXT,
  metadata_json TEXT NOT NULL,
  last_migration_at TEXT,
  last_provisioning_error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tenant_domains (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  hostname TEXT NOT NULL UNIQUE,
  is_primary INTEGER NOT NULL DEFAULT 0,
  verified_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tenant_audit_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT REFERENCES tenants(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  actor_id TEXT,
  actor_email TEXT,
  metadata_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
`;

export const POSTGRES_PLATFORM_FOUNDATION_SQL = `
CREATE TABLE IF NOT EXISTS platform_migrations (
  id TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL,
  database_provider TEXT NOT NULL,
  database_url_encrypted_json TEXT NOT NULL,
  uploads_path TEXT NOT NULL,
  subdomain TEXT UNIQUE,
  primary_domain TEXT UNIQUE,
  plan TEXT,
  metadata_json TEXT NOT NULL,
  last_migration_at TEXT,
  last_provisioning_error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tenant_domains (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  hostname TEXT NOT NULL UNIQUE,
  is_primary INTEGER NOT NULL DEFAULT 0,
  verified_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tenant_audit_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT REFERENCES tenants(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  actor_id TEXT,
  actor_email TEXT,
  metadata_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
`;

export const MYSQL_PLATFORM_FOUNDATION_SQL = `
CREATE TABLE IF NOT EXISTS platform_migrations (
  id VARCHAR(191) PRIMARY KEY,
  applied_at VARCHAR(64) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tenants (
  id VARCHAR(191) PRIMARY KEY,
  slug VARCHAR(191) NOT NULL UNIQUE,
  display_name VARCHAR(191) NOT NULL,
  status VARCHAR(64) NOT NULL,
  database_provider VARCHAR(64) NOT NULL,
  database_url_encrypted_json LONGTEXT NOT NULL,
  uploads_path TEXT NOT NULL,
  subdomain VARCHAR(191) UNIQUE,
  primary_domain VARCHAR(191) UNIQUE,
  plan VARCHAR(191),
  metadata_json LONGTEXT NOT NULL,
  last_migration_at VARCHAR(64),
  last_provisioning_error TEXT,
  created_at VARCHAR(64) NOT NULL,
  updated_at VARCHAR(64) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tenant_domains (
  id VARCHAR(191) PRIMARY KEY,
  tenant_id VARCHAR(191) NOT NULL,
  hostname VARCHAR(191) NOT NULL UNIQUE,
  is_primary TINYINT(1) NOT NULL DEFAULT 0,
  verified_at VARCHAR(64),
  created_at VARCHAR(64) NOT NULL,
  updated_at VARCHAR(64) NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tenant_audit_events (
  id VARCHAR(191) PRIMARY KEY,
  tenant_id VARCHAR(191),
  action VARCHAR(191) NOT NULL,
  actor_id VARCHAR(191),
  actor_email VARCHAR(191),
  metadata_json LONGTEXT NOT NULL,
  created_at VARCHAR(64) NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL
) ENGINE=InnoDB;
`;
