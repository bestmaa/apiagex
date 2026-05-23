import { createHash } from "node:crypto";
import { randomBytes } from "node:crypto";
import {
  encryptTenantSecret,
  openPostgresAdapter,
  type ApiagexDatabase,
} from "@apiagex/database";
import type {
  PostgresTenantProvisioningConfig,
  TenantProvisioningRequest,
  TenantProvisioningResult,
} from "./tenant-provisioning.type.js";

export type PostgresTenantDatabaseProvisioningOptions = {
  openAdminDatabase?: ((url: string) => Promise<ApiagexDatabase>) | undefined;
  openTenantDatabase?: ((url: string) => Promise<ApiagexDatabase>) | undefined;
};

export type PostgresTenantUserProvisioningOptions = {
  generatePassword?: (() => string) | undefined;
  openAdminDatabase?: ((url: string) => Promise<ApiagexDatabase>) | undefined;
  openTenantAdminDatabase?: ((url: string) => Promise<ApiagexDatabase>) | undefined;
};

export type PostgresTenantDatabaseNames = {
  databaseName: string;
};

export type PostgresTenantUserNames = PostgresTenantDatabaseNames & {
  username: string;
};

const identifierMaxLength = 63;
const slugPattern = /^[a-z][a-z0-9-]*$/;

export async function provisionPostgresTenantDatabase(
  config: PostgresTenantProvisioningConfig,
  request: TenantProvisioningRequest,
  options: PostgresTenantDatabaseProvisioningOptions = {},
): Promise<TenantProvisioningResult> {
  if (request.provider !== "postgres") throw new Error("TENANT_PROVISIONING_PROVIDER_MISMATCH");
  const names = buildPostgresTenantDatabaseNames(request.slug, config.databaseNamePrefix);
  const tenantDatabaseUrl = buildPostgresTenantDatabaseUrl(config.provisioningDatabaseUrl, names.databaseName);
  const openAdminDatabase = options.openAdminDatabase ?? ((url) => openPostgresAdapter(url, { migrate: false }));
  const openTenantDatabase = options.openTenantDatabase ?? ((url) => openPostgresAdapter(url, { migrate: true }));

  const adminDb = await openAdminDatabase(config.provisioningDatabaseUrl);
  try {
    const existing = await adminDb
      .prepare("SELECT 1 AS exists FROM pg_database WHERE datname = ?")
      .get<{ exists: number }>(names.databaseName);
    if (!existing) await adminDb.exec(postgresCreateDatabaseSql(names.databaseName));
  } finally {
    await adminDb.close();
  }

  const tenantDb = await openTenantDatabase(tenantDatabaseUrl);
  await tenantDb.close();

  return {
    encryptedDatabaseUrl: encryptTenantSecret(tenantDatabaseUrl, config.secretKey),
    provider: "postgres",
    tenantId: request.tenantId,
    uploadsPath: `${config.uploadsRoot.replace(/\/+$/, "")}/${request.slug}/uploads`,
  };
}

export function buildPostgresTenantDatabaseNames(
  slug: string,
  prefix = "apiagex_",
): PostgresTenantDatabaseNames {
  if (!slugPattern.test(slug)) throw new Error("TENANT_PROVISIONING_SLUG_INVALID");
  const base = `${prefix}${slug}`.toLowerCase().replace(/[^a-z0-9_]+/g, "_");
  return { databaseName: shortenPostgresIdentifier(base, slug) };
}

export async function provisionPostgresTenantUser(
  config: PostgresTenantProvisioningConfig,
  request: TenantProvisioningRequest,
  options: PostgresTenantUserProvisioningOptions = {},
): Promise<TenantProvisioningResult> {
  if (request.provider !== "postgres") throw new Error("TENANT_PROVISIONING_PROVIDER_MISMATCH");
  const names = buildPostgresTenantUserNames(request.slug, config);
  const password = options.generatePassword?.() ?? generatePostgresTenantPassword();
  const adminUrl = config.provisioningDatabaseUrl;
  const tenantAdminUrl = buildPostgresTenantDatabaseUrl(adminUrl, names.databaseName);
  const tenantRuntimeUrl = buildPostgresTenantUserUrl(adminUrl, names.databaseName, names.username, password);
  const openAdminDatabase = options.openAdminDatabase ?? ((url) => openPostgresAdapter(url, { migrate: false }));
  const openTenantAdminDatabase = options.openTenantAdminDatabase ?? ((url) => openPostgresAdapter(url, { migrate: false }));

  const adminDb = await openAdminDatabase(adminUrl);
  try {
    const existing = await adminDb
      .prepare("SELECT 1 AS exists FROM pg_roles WHERE rolname = ?")
      .get<{ exists: number }>(names.username);
    if (existing) {
      await adminDb.exec(postgresAlterRolePasswordSql(names.username, password));
    } else {
      await adminDb.exec(postgresCreateRoleSql(names.username, password));
    }
    await adminDb.exec(postgresGrantDatabaseSql(names.databaseName, names.username));
  } finally {
    await adminDb.close();
  }

  const tenantAdminDb = await openTenantAdminDatabase(tenantAdminUrl);
  try {
    for (const sql of postgresGrantTenantSchemaSql(names.username)) {
      await tenantAdminDb.exec(sql);
    }
  } finally {
    await tenantAdminDb.close();
  }

  return {
    encryptedDatabaseUrl: encryptTenantSecret(tenantRuntimeUrl, config.secretKey),
    provider: "postgres",
    tenantId: request.tenantId,
    uploadsPath: `${config.uploadsRoot.replace(/\/+$/, "")}/${request.slug}/uploads`,
  };
}

export function buildPostgresTenantUserNames(
  slug: string,
  config: Pick<PostgresTenantProvisioningConfig, "databaseNamePrefix" | "tenantUsernamePrefix"> = {},
): PostgresTenantUserNames {
  const { databaseName } = buildPostgresTenantDatabaseNames(slug, config.databaseNamePrefix);
  const usernamePrefix = config.tenantUsernamePrefix ?? "apiagex_";
  const usernameBase = `${usernamePrefix}${slug}_user`.toLowerCase().replace(/[^a-z0-9_]+/g, "_");
  return {
    databaseName,
    username: shortenPostgresIdentifier(usernameBase, `${slug}:user`),
  };
}

export function buildPostgresTenantUserUrl(
  provisioningDatabaseUrl: string,
  databaseName: string,
  username: string,
  password: string,
): string {
  const url = new URL(buildPostgresTenantDatabaseUrl(provisioningDatabaseUrl, databaseName));
  url.username = username;
  url.password = password;
  return url.toString();
}

export function buildPostgresTenantDatabaseUrl(provisioningDatabaseUrl: string, databaseName: string): string {
  if (!provisioningDatabaseUrl.trim()) throw new Error("TENANT_POSTGRES_PROVISIONING_URL_REQUIRED");
  const url = new URL(provisioningDatabaseUrl);
  url.pathname = `/${databaseName}`;
  return url.toString();
}

export function postgresCreateDatabaseSql(databaseName: string): string {
  return `CREATE DATABASE ${quotePostgresIdentifier(databaseName)}`;
}

export function postgresCreateRoleSql(username: string, password: string): string {
  return `CREATE ROLE ${quotePostgresIdentifier(username)} LOGIN PASSWORD ${quotePostgresLiteral(password)}`;
}

export function postgresAlterRolePasswordSql(username: string, password: string): string {
  return `ALTER ROLE ${quotePostgresIdentifier(username)} WITH PASSWORD ${quotePostgresLiteral(password)}`;
}

export function postgresGrantDatabaseSql(databaseName: string, username: string): string {
  return [
    `GRANT CONNECT ON DATABASE ${quotePostgresIdentifier(databaseName)} TO ${quotePostgresIdentifier(username)}`,
    `GRANT ALL PRIVILEGES ON DATABASE ${quotePostgresIdentifier(databaseName)} TO ${quotePostgresIdentifier(username)}`,
  ].join(";\n");
}

export function postgresGrantTenantSchemaSql(username: string): string[] {
  const quoted = quotePostgresIdentifier(username);
  return [
    `GRANT USAGE, CREATE ON SCHEMA public TO ${quoted}`,
    `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${quoted}`,
    `GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO ${quoted}`,
    `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${quoted}`,
    `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO ${quoted}`,
  ];
}

export function quotePostgresIdentifier(identifier: string): string {
  if (!identifier || identifier.length > identifierMaxLength) throw new Error("TENANT_POSTGRES_IDENTIFIER_INVALID");
  return `"${identifier.replaceAll("\"", "\"\"")}"`;
}

export function generatePostgresTenantPassword(): string {
  return randomBytes(24).toString("base64url");
}

function quotePostgresLiteral(value: string): string {
  if (!value) throw new Error("TENANT_POSTGRES_PASSWORD_REQUIRED");
  return `'${value.replaceAll("'", "''")}'`;
}

function shortenPostgresIdentifier(value: string, slug: string): string {
  const normalized = value.replace(/^_+/, "").replace(/_+$/, "");
  if (!normalized || !/^[a-z_]/.test(normalized)) throw new Error("TENANT_POSTGRES_IDENTIFIER_INVALID");
  if (normalized.length <= identifierMaxLength) return normalized;
  const hash = createHash("sha256").update(slug).digest("hex").slice(0, 8);
  return `${normalized.slice(0, identifierMaxLength - hash.length - 1)}_${hash}`;
}
