import type { DatabaseProvider, TenantStatus } from "@apiagex/database";

export const TENANT_BACKUP_FORMAT_VERSION = "apiagex-tenant-backup/v1" as const;

export type TenantBackupFileManifest = {
  checksumSha256: string;
  contentType?: string;
  path: string;
  sizeBytes: number;
};

export type TenantBackupManifest = {
  createdAt: string;
  database: {
    artifactPath: string;
    checksumSha256: string;
    provider: DatabaseProvider;
    sizeBytes: number;
  };
  formatVersion: typeof TENANT_BACKUP_FORMAT_VERSION;
  includes: {
    contentData: boolean;
    secrets: false;
    uploads: boolean;
  };
  source?: {
    apiagexVersion?: string;
    environment?: string;
  };
  tenant: {
    domain?: string;
    id: string;
    provider: DatabaseProvider;
    slug: string;
    status?: TenantStatus;
  };
  uploads: {
    basePath: "uploads/";
    files: TenantBackupFileManifest[];
  };
};

const forbiddenSecretKeys = new Set([
  "databaseUrl",
  "encryptedDatabaseUrl",
  "encrypted_database_url",
  "password",
  "secret",
  "token",
]);

export function isTenantBackupManifest(value: unknown): value is TenantBackupManifest {
  if (!isPlainObject(value)) return false;
  if (value.formatVersion !== TENANT_BACKUP_FORMAT_VERSION) return false;
  if (containsForbiddenSecretKey(value)) return false;
  if (!isPlainObject(value.tenant) || !isString(value.tenant.id) || !isSlug(value.tenant.slug)) return false;
  if (!isDatabaseProvider(value.tenant.provider)) return false;
  if (value.tenant.domain !== undefined && !isString(value.tenant.domain)) return false;
  if (value.tenant.status !== undefined && !isTenantStatus(value.tenant.status)) return false;
  if (!isIsoDate(value.createdAt)) return false;
  if (!isPlainObject(value.includes) || value.includes.secrets !== false) return false;
  if (typeof value.includes.contentData !== "boolean" || typeof value.includes.uploads !== "boolean") return false;
  if (!isPlainObject(value.database)) return false;
  if (!isDatabaseProvider(value.database.provider)) return false;
  if (!isSafeRelativePath(value.database.artifactPath)) return false;
  if (!isSha256(value.database.checksumSha256) || !isNonNegativeInteger(value.database.sizeBytes)) return false;
  if (!isPlainObject(value.uploads) || value.uploads.basePath !== "uploads/" || !Array.isArray(value.uploads.files)) {
    return false;
  }
  return value.uploads.files.every(isTenantBackupFileManifest);
}

function isTenantBackupFileManifest(value: unknown): value is TenantBackupFileManifest {
  if (!isPlainObject(value)) return false;
  if (!isSafeRelativePath(value.path) || !isSha256(value.checksumSha256) || !isNonNegativeInteger(value.sizeBytes)) {
    return false;
  }
  return value.contentType === undefined || isString(value.contentType);
}

function containsForbiddenSecretKey(value: unknown): boolean {
  if (Array.isArray(value)) return value.some((item) => containsForbiddenSecretKey(item));
  if (!isPlainObject(value)) return false;
  for (const [key, child] of Object.entries(value)) {
    if (forbiddenSecretKeys.has(key)) return true;
    if (containsForbiddenSecretKey(child)) return true;
  }
  return false;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isSlug(value: unknown): value is string {
  return typeof value === "string" && /^[a-z][a-z0-9-]*$/.test(value);
}

function isDatabaseProvider(value: unknown): value is DatabaseProvider {
  return value === "sqlite" || value === "postgres" || value === "mysql";
}

function isTenantStatus(value: unknown): value is TenantStatus {
  return value === "active" || value === "suspended" || value === "provisioning" || value === "failed";
}

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isSha256(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/i.test(value);
}

function isSafeRelativePath(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && !value.startsWith("/") && !value.includes("..");
}
