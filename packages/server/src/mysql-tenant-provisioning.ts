import { createHash } from "node:crypto";
import { randomBytes } from "node:crypto";
import {
  encryptTenantSecret,
  openMySqlAdapter,
  type ApiagexDatabase,
} from "@apiagex/database";
import type {
  MySqlTenantProvisioningConfig,
  TenantProvisioningRequest,
  TenantProvisioningResult,
} from "./tenant-provisioning.type.js";

export type MySqlTenantDatabaseProvisioningOptions = {
  openAdminDatabase?: ((url: string) => Promise<ApiagexDatabase>) | undefined;
  openTenantDatabase?: ((url: string) => Promise<ApiagexDatabase>) | undefined;
};

export type MySqlTenantUserProvisioningOptions = {
  generatePassword?: (() => string) | undefined;
  openAdminDatabase?: ((url: string) => Promise<ApiagexDatabase>) | undefined;
};

export type MySqlTenantDatabaseNames = {
  databaseName: string;
};

export type MySqlTenantUserNames = MySqlTenantDatabaseNames & {
  username: string;
};

const identifierMaxLength = 64;
const slugPattern = /^[a-z][a-z0-9-]*$/;

export async function provisionMySqlTenantDatabase(
  config: MySqlTenantProvisioningConfig,
  request: TenantProvisioningRequest,
  options: MySqlTenantDatabaseProvisioningOptions = {},
): Promise<TenantProvisioningResult> {
  if (request.provider !== "mysql") throw new Error("TENANT_PROVISIONING_PROVIDER_MISMATCH");
  const names = buildMySqlTenantDatabaseNames(request.slug, config.databaseNamePrefix);
  const tenantDatabaseUrl = buildMySqlTenantDatabaseUrl(config.provisioningDatabaseUrl, names.databaseName);
  const openAdminDatabase = options.openAdminDatabase ?? ((url) => openMySqlAdapter(url, { migrate: false }));
  const openTenantDatabase = options.openTenantDatabase ?? ((url) => openMySqlAdapter(url, { migrate: true }));

  const adminDb = await openAdminDatabase(config.provisioningDatabaseUrl);
  try {
    await adminDb.exec(mySqlCreateDatabaseSql(names.databaseName));
  } finally {
    await adminDb.close();
  }

  const tenantDb = await openTenantDatabase(tenantDatabaseUrl);
  await tenantDb.close();

  return {
    encryptedDatabaseUrl: encryptTenantSecret(tenantDatabaseUrl, config.secretKey),
    provider: "mysql",
    tenantId: request.tenantId,
    uploadsPath: `${config.uploadsRoot.replace(/\/+$/, "")}/${request.slug}/uploads`,
  };
}

export function buildMySqlTenantDatabaseNames(
  slug: string,
  prefix = "apiagex_",
): MySqlTenantDatabaseNames {
  if (!slugPattern.test(slug)) throw new Error("TENANT_PROVISIONING_SLUG_INVALID");
  const base = `${prefix}${slug}`.toLowerCase().replace(/[^a-z0-9_]+/g, "_");
  return { databaseName: shortenMySqlIdentifier(base, slug) };
}

export async function provisionMySqlTenantUser(
  config: MySqlTenantProvisioningConfig,
  request: TenantProvisioningRequest,
  options: MySqlTenantUserProvisioningOptions = {},
): Promise<TenantProvisioningResult> {
  if (request.provider !== "mysql") throw new Error("TENANT_PROVISIONING_PROVIDER_MISMATCH");
  const names = buildMySqlTenantUserNames(request.slug, config);
  const password = options.generatePassword?.() ?? generateMySqlTenantPassword();
  const tenantRuntimeUrl = buildMySqlTenantUserUrl(
    config.provisioningDatabaseUrl,
    names.databaseName,
    names.username,
    password,
  );
  const openAdminDatabase = options.openAdminDatabase ?? ((url) => openMySqlAdapter(url, { migrate: false }));

  const adminDb = await openAdminDatabase(config.provisioningDatabaseUrl);
  try {
    await adminDb.exec(mySqlCreateUserSql(names.username, password));
    await adminDb.exec(mySqlAlterUserPasswordSql(names.username, password));
    await adminDb.exec(mySqlGrantDatabaseSql(names.databaseName, names.username));
  } finally {
    await adminDb.close();
  }

  return {
    encryptedDatabaseUrl: encryptTenantSecret(tenantRuntimeUrl, config.secretKey),
    provider: "mysql",
    tenantId: request.tenantId,
    uploadsPath: `${config.uploadsRoot.replace(/\/+$/, "")}/${request.slug}/uploads`,
  };
}

export function buildMySqlTenantUserNames(
  slug: string,
  config: Pick<MySqlTenantProvisioningConfig, "databaseNamePrefix" | "tenantUsernamePrefix"> = {},
): MySqlTenantUserNames {
  const { databaseName } = buildMySqlTenantDatabaseNames(slug, config.databaseNamePrefix);
  const usernamePrefix = config.tenantUsernamePrefix ?? "apiagex_";
  const usernameBase = `${usernamePrefix}${slug}_user`.toLowerCase().replace(/[^a-z0-9_]+/g, "_");
  return {
    databaseName,
    username: shortenMySqlUsername(usernameBase, `${slug}:user`),
  };
}

export function buildMySqlTenantUserUrl(
  provisioningDatabaseUrl: string,
  databaseName: string,
  username: string,
  password: string,
): string {
  const url = new URL(buildMySqlTenantDatabaseUrl(provisioningDatabaseUrl, databaseName));
  url.username = username;
  url.password = password;
  return url.toString();
}

export function buildMySqlTenantDatabaseUrl(provisioningDatabaseUrl: string, databaseName: string): string {
  if (!provisioningDatabaseUrl.trim()) throw new Error("TENANT_MYSQL_PROVISIONING_URL_REQUIRED");
  const url = new URL(provisioningDatabaseUrl);
  url.pathname = `/${databaseName}`;
  return url.toString();
}

export function mySqlCreateDatabaseSql(databaseName: string): string {
  return `CREATE DATABASE IF NOT EXISTS ${quoteMySqlIdentifier(databaseName)} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`;
}

export function mySqlCreateUserSql(username: string, password: string): string {
  return `CREATE USER IF NOT EXISTS ${quoteMySqlUser(username)} IDENTIFIED BY ${quoteMySqlLiteral(password)}`;
}

export function mySqlAlterUserPasswordSql(username: string, password: string): string {
  return `ALTER USER ${quoteMySqlUser(username)} IDENTIFIED BY ${quoteMySqlLiteral(password)}`;
}

export function mySqlGrantDatabaseSql(databaseName: string, username: string): string {
  return `GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES ON ${quoteMySqlIdentifier(databaseName)}.* TO ${quoteMySqlUser(username)}`;
}

export function quoteMySqlIdentifier(identifier: string): string {
  if (!identifier || identifier.length > identifierMaxLength) throw new Error("TENANT_MYSQL_IDENTIFIER_INVALID");
  return `\`${identifier.replaceAll("`", "``")}\``;
}

function shortenMySqlIdentifier(value: string, slug: string): string {
  const normalized = value.replace(/^_+/, "").replace(/_+$/, "");
  if (!normalized || !/^[a-z_]/.test(normalized)) throw new Error("TENANT_MYSQL_IDENTIFIER_INVALID");
  if (normalized.length <= identifierMaxLength) return normalized;
  const hash = createHash("sha256").update(slug).digest("hex").slice(0, 8);
  return `${normalized.slice(0, identifierMaxLength - hash.length - 1)}_${hash}`;
}

export function generateMySqlTenantPassword(): string {
  return randomBytes(24).toString("base64url");
}

function shortenMySqlUsername(value: string, slug: string): string {
  const normalized = value.replace(/^_+/, "").replace(/_+$/, "");
  if (!normalized || !/^[a-z_]/.test(normalized)) throw new Error("TENANT_MYSQL_IDENTIFIER_INVALID");
  if (normalized.length <= 32) return normalized;
  const hash = createHash("sha256").update(slug).digest("hex").slice(0, 8);
  return `${normalized.slice(0, 32 - hash.length - 1)}_${hash}`;
}

function quoteMySqlUser(username: string): string {
  return `${quoteMySqlLiteral(username)}@'%'`;
}

function quoteMySqlLiteral(value: string): string {
  if (!value) throw new Error("TENANT_MYSQL_LITERAL_REQUIRED");
  return `'${value.replaceAll("\\", "\\\\").replaceAll("'", "''")}'`;
}
