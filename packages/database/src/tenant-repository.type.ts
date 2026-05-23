export const TENANT_DATABASE_PROVIDERS = ["sqlite", "postgres", "mysql"] as const;

export const TENANT_STATUSES = [
  "provisioning",
  "active",
  "suspended",
  "migration_required",
  "failed",
  "archived",
] as const;

export type TenantDatabaseProvider = typeof TENANT_DATABASE_PROVIDERS[number];

export type TenantStatus = typeof TENANT_STATUSES[number];

export type TenantEncryptedSecret = {
  algorithm: "aes-256-gcm";
  ciphertext: string;
  iv: string;
  keyId?: string | undefined;
  tag: string;
  version: 1;
};

export type TenantDomainRecord = {
  createdAt: string;
  hostname: string;
  id: string;
  primary: boolean;
  tenantId: string;
  updatedAt: string;
  verifiedAt: string | null;
};

export type TenantRecord = {
  createdAt: string;
  databaseProvider: TenantDatabaseProvider;
  databaseUrlEncrypted: TenantEncryptedSecret;
  displayName: string;
  id: string;
  lastMigrationAt: string | null;
  lastProvisioningError: string | null;
  metadata: Record<string, unknown>;
  plan: string | null;
  primaryDomain: string | null;
  slug: string;
  status: TenantStatus;
  subdomain: string | null;
  updatedAt: string;
  uploadsPath: string;
};

export type TenantSafeRecord = Omit<TenantRecord, "databaseUrlEncrypted"> & {
  databaseUrlConfigured: boolean;
};

export type CreateTenantInput = {
  databaseProvider: TenantDatabaseProvider;
  databaseUrlEncrypted: TenantEncryptedSecret;
  displayName: string;
  metadata?: Record<string, unknown> | undefined;
  plan?: string | null | undefined;
  primaryDomain?: string | null | undefined;
  slug: string;
  status?: TenantStatus | undefined;
  subdomain?: string | null | undefined;
  uploadsPath: string;
};

export type UpdateTenantInput = {
  databaseUrlEncrypted?: TenantEncryptedSecret | undefined;
  displayName?: string | undefined;
  lastMigrationAt?: string | null | undefined;
  lastProvisioningError?: string | null | undefined;
  metadata?: Record<string, unknown> | undefined;
  plan?: string | null | undefined;
  primaryDomain?: string | null | undefined;
  status?: TenantStatus | undefined;
  subdomain?: string | null | undefined;
  uploadsPath?: string | undefined;
};

export type ListTenantsOptions = {
  databaseProvider?: TenantDatabaseProvider | undefined;
  status?: TenantStatus | undefined;
};

export type TenantLookup = {
  domain?: string | undefined;
  id?: string | undefined;
  slug?: string | undefined;
  subdomain?: string | undefined;
};

export type TenantAuditEventRecord = {
  action: string;
  actorEmail: string | null;
  actorId: string | null;
  createdAt: string;
  id: string;
  metadata: Record<string, unknown>;
  tenantId: string | null;
};

export type RecordTenantAuditEventInput = {
  action: string;
  actorEmail?: string | null | undefined;
  actorId?: string | null | undefined;
  metadata?: Record<string, unknown> | undefined;
  tenantId?: string | null | undefined;
};
