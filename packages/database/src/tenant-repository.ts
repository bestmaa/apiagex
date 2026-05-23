import { randomUUID } from "node:crypto";
import type { ApiagexDatabase, DatabaseQueryParam } from "./database-adapter.type.js";
import {
  TENANT_DATABASE_PROVIDERS,
  TENANT_STATUSES,
  type CreateTenantInput,
  type ListTenantsOptions,
  type RecordTenantAuditEventInput,
  type TenantAuditEventRecord,
  type TenantDatabaseProvider,
  type TenantEncryptedSecret,
  type TenantLookup,
  type TenantRecord,
  type TenantSafeRecord,
  type TenantStatus,
  type UpdateTenantInput,
} from "./tenant-repository.type.js";
import { assertTenantSecretEnvelope } from "./tenant-secret.js";

type TenantRow = {
  createdAt: string;
  databaseProvider: TenantDatabaseProvider;
  databaseUrlEncryptedJson: string;
  displayName: string;
  id: string;
  lastMigrationAt: string | null;
  lastProvisioningError: string | null;
  metadataJson: string;
  plan: string | null;
  primaryDomain: string | null;
  slug: string;
  status: TenantStatus;
  subdomain: string | null;
  updatedAt: string;
  uploadsPath: string;
};

type TenantAuditEventRow = {
  action: string;
  actorEmail: string | null;
  actorId: string | null;
  createdAt: string;
  id: string;
  metadataJson: string;
  tenantId: string | null;
};

const slugPattern = /^[a-z][a-z0-9-]*$/;

export async function createTenant(db: ApiagexDatabase, input: CreateTenantInput): Promise<TenantRecord> {
  validateCreateTenantInput(input);
  const id = randomUUID();
  const now = new Date().toISOString();
  await db.prepare(
    [
      "INSERT INTO tenants",
      "(id, slug, display_name, status, database_provider, database_url_encrypted_json, uploads_path, subdomain, primary_domain, plan, metadata_json, last_migration_at, last_provisioning_error, created_at, updated_at)",
      "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ].join(" "),
  ).run(
    id,
    input.slug,
    input.displayName,
    input.status ?? "provisioning",
    input.databaseProvider,
    JSON.stringify(input.databaseUrlEncrypted),
    input.uploadsPath,
    normalizeNullable(input.subdomain),
    normalizeNullable(input.primaryDomain),
    normalizeNullable(input.plan),
    JSON.stringify(input.metadata ?? {}),
    null,
    null,
    now,
    now,
  );
  return requireTenantById(db, id);
}

export async function listTenants(
  db: ApiagexDatabase,
  options: ListTenantsOptions = {},
): Promise<TenantRecord[]> {
  const filters: string[] = [];
  const params: DatabaseQueryParam[] = [];
  if (options.status) {
    filters.push("status = ?");
    params.push(options.status);
  }
  if (options.databaseProvider) {
    filters.push("database_provider = ?");
    params.push(options.databaseProvider);
  }
  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const rows = await db.prepare(`${tenantSelectSql()} ${where} ORDER BY created_at ASC`).all<TenantRow>(...params);
  return rows.map(rowToTenant);
}

export async function getTenantById(db: ApiagexDatabase, id: string): Promise<TenantRecord | undefined> {
  const row = await db.prepare(`${tenantSelectSql()} WHERE id = ?`).get<TenantRow>(id);
  return row ? rowToTenant(row) : undefined;
}

export async function getTenantBySlug(db: ApiagexDatabase, slug: string): Promise<TenantRecord | undefined> {
  const row = await db.prepare(`${tenantSelectSql()} WHERE slug = ?`).get<TenantRow>(slug);
  return row ? rowToTenant(row) : undefined;
}

export async function getTenantByDomain(db: ApiagexDatabase, hostname: string): Promise<TenantRecord | undefined> {
  const normalized = normalizeHost(hostname);
  const row = await db.prepare(
    [
      tenantSelectSql("t"),
      "WHERE t.primary_domain = ?",
      "OR EXISTS (SELECT 1 FROM tenant_domains td WHERE td.tenant_id = t.id AND td.hostname = ?)",
    ].join(" "),
  ).get<TenantRow>(normalized, normalized);
  return row ? rowToTenant(row) : undefined;
}

export async function findTenant(db: ApiagexDatabase, lookup: TenantLookup): Promise<TenantRecord | undefined> {
  if (lookup.id) return getTenantById(db, lookup.id);
  if (lookup.slug) return getTenantBySlug(db, lookup.slug);
  if (lookup.domain) return getTenantByDomain(db, lookup.domain);
  if (lookup.subdomain) {
    const row = await db.prepare(`${tenantSelectSql()} WHERE subdomain = ?`).get<TenantRow>(lookup.subdomain);
    return row ? rowToTenant(row) : undefined;
  }
  return undefined;
}

export async function updateTenant(
  db: ApiagexDatabase,
  id: string,
  input: UpdateTenantInput,
): Promise<TenantRecord> {
  validateUpdateTenantInput(input);
  const fields: string[] = [];
  const params: DatabaseQueryParam[] = [];
  addUpdate(fields, params, "display_name", input.displayName);
  addUpdate(fields, params, "status", input.status);
  addUpdate(fields, params, "database_url_encrypted_json", input.databaseUrlEncrypted === undefined ? undefined : JSON.stringify(input.databaseUrlEncrypted));
  addUpdate(fields, params, "uploads_path", input.uploadsPath);
  addUpdate(fields, params, "subdomain", nullablePatch(input.subdomain));
  addUpdate(fields, params, "primary_domain", nullablePatch(input.primaryDomain));
  addUpdate(fields, params, "plan", nullablePatch(input.plan));
  addUpdate(fields, params, "metadata_json", input.metadata === undefined ? undefined : JSON.stringify(input.metadata));
  addUpdate(fields, params, "last_migration_at", nullablePatch(input.lastMigrationAt));
  addUpdate(fields, params, "last_provisioning_error", nullablePatch(input.lastProvisioningError));
  if (fields.length > 0) {
    fields.push("updated_at = ?");
    params.push(new Date().toISOString(), id);
    await db.prepare(`UPDATE tenants SET ${fields.join(", ")} WHERE id = ?`).run(...params);
  }
  return requireTenantById(db, id);
}

export function toSafeTenant(tenant: TenantRecord): TenantSafeRecord {
  const { databaseUrlEncrypted: _databaseUrlEncrypted, ...safe } = tenant;
  return { ...safe, databaseUrlConfigured: true };
}

export async function recordTenantAuditEvent(
  db: ApiagexDatabase,
  input: RecordTenantAuditEventInput,
): Promise<TenantAuditEventRecord> {
  if (!input.action.trim()) throw new Error("TENANT_AUDIT_ACTION_REQUIRED");
  validateMetadata(input.metadata ?? {});
  const id = randomUUID();
  const now = new Date().toISOString();
  await db.prepare(
    "INSERT INTO tenant_audit_events (id, tenant_id, action, actor_id, actor_email, metadata_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
  ).run(
    id,
    normalizeNullable(input.tenantId),
    input.action,
    normalizeNullable(input.actorId),
    normalizeNullable(input.actorEmail),
    JSON.stringify(input.metadata ?? {}),
    now,
  );
  const event = await db.prepare(auditEventSelectSql("WHERE id = ?")).get<TenantAuditEventRow>(id);
  if (!event) throw new Error("TENANT_AUDIT_EVENT_NOT_FOUND");
  return rowToAuditEvent(event);
}

export async function listTenantAuditEvents(
  db: ApiagexDatabase,
  tenantId?: string | undefined,
): Promise<TenantAuditEventRecord[]> {
  const where = tenantId ? "WHERE tenant_id = ?" : "";
  const params = tenantId ? [tenantId] : [];
  const rows = await db.prepare(`${auditEventSelectSql(where)} ORDER BY created_at ASC`).all<TenantAuditEventRow>(...params);
  return rows.map(rowToAuditEvent);
}

function tenantSelectSql(alias = ""): string {
  const prefix = alias ? `${alias}.` : "";
  return [
    "SELECT",
    `${prefix}id as id,`,
    `${prefix}slug as slug,`,
    `${prefix}display_name as displayName,`,
    `${prefix}status as status,`,
    `${prefix}database_provider as databaseProvider,`,
    `${prefix}database_url_encrypted_json as databaseUrlEncryptedJson,`,
    `${prefix}uploads_path as uploadsPath,`,
    `${prefix}subdomain as subdomain,`,
    `${prefix}primary_domain as primaryDomain,`,
    `${prefix}plan as plan,`,
    `${prefix}metadata_json as metadataJson,`,
    `${prefix}last_migration_at as lastMigrationAt,`,
    `${prefix}last_provisioning_error as lastProvisioningError,`,
    `${prefix}created_at as createdAt,`,
    `${prefix}updated_at as updatedAt`,
    `FROM tenants${alias ? ` ${alias}` : ""}`,
  ].join(" ");
}

function auditEventSelectSql(where: string): string {
  return [
    "SELECT",
    "id as id,",
    "tenant_id as tenantId,",
    "action as action,",
    "actor_id as actorId,",
    "actor_email as actorEmail,",
    "metadata_json as metadataJson,",
    "created_at as createdAt",
    "FROM tenant_audit_events",
    where,
  ].filter(Boolean).join(" ");
}

async function requireTenantById(db: ApiagexDatabase, id: string): Promise<TenantRecord> {
  const tenant = await getTenantById(db, id);
  if (!tenant) throw new Error("TENANT_NOT_FOUND");
  return tenant;
}

function rowToTenant(row: TenantRow): TenantRecord {
  return {
    createdAt: row.createdAt,
    databaseProvider: row.databaseProvider,
    databaseUrlEncrypted: parseEncryptedSecret(row.databaseUrlEncryptedJson),
    displayName: row.displayName,
    id: row.id,
    lastMigrationAt: row.lastMigrationAt,
    lastProvisioningError: row.lastProvisioningError,
    metadata: parseMetadata(row.metadataJson),
    plan: row.plan,
    primaryDomain: row.primaryDomain,
    slug: row.slug,
    status: row.status,
    subdomain: row.subdomain,
    updatedAt: row.updatedAt,
    uploadsPath: row.uploadsPath,
  };
}

function rowToAuditEvent(row: TenantAuditEventRow): TenantAuditEventRecord {
  return {
    action: row.action,
    actorEmail: row.actorEmail,
    actorId: row.actorId,
    createdAt: row.createdAt,
    id: row.id,
    metadata: parseMetadata(row.metadataJson),
    tenantId: row.tenantId,
  };
}

function validateCreateTenantInput(input: CreateTenantInput): void {
  if (!slugPattern.test(input.slug)) throw new Error("TENANT_SLUG_INVALID");
  if (!input.displayName.trim()) throw new Error("TENANT_DISPLAY_NAME_REQUIRED");
  if (!TENANT_DATABASE_PROVIDERS.includes(input.databaseProvider)) throw new Error("TENANT_DATABASE_PROVIDER_INVALID");
  if (input.status && !TENANT_STATUSES.includes(input.status)) throw new Error("TENANT_STATUS_INVALID");
  if (!input.uploadsPath.trim()) throw new Error("TENANT_UPLOADS_PATH_REQUIRED");
  validateEncryptedSecret(input.databaseUrlEncrypted);
  validateMetadata(input.metadata ?? {});
}

function validateUpdateTenantInput(input: UpdateTenantInput): void {
  if (input.displayName !== undefined && !input.displayName.trim()) throw new Error("TENANT_DISPLAY_NAME_REQUIRED");
  if (input.status !== undefined && !TENANT_STATUSES.includes(input.status)) throw new Error("TENANT_STATUS_INVALID");
  if (input.uploadsPath !== undefined && !input.uploadsPath.trim()) throw new Error("TENANT_UPLOADS_PATH_REQUIRED");
  if (input.databaseUrlEncrypted !== undefined) validateEncryptedSecret(input.databaseUrlEncrypted);
  if (input.metadata !== undefined) validateMetadata(input.metadata);
}

function validateEncryptedSecret(secret: TenantEncryptedSecret): void {
  assertTenantSecretEnvelope(secret);
}

function validateMetadata(value: Record<string, unknown>): void {
  if (!isPlainRecord(value)) throw new Error("TENANT_METADATA_INVALID");
}

function parseEncryptedSecret(value: string): TenantEncryptedSecret {
  const parsed = JSON.parse(value) as TenantEncryptedSecret;
  validateEncryptedSecret(parsed);
  return parsed;
}

function parseMetadata(value: string): Record<string, unknown> {
  const parsed = JSON.parse(value) as unknown;
  return isPlainRecord(parsed) ? parsed : {};
}

function normalizeHost(value: string): string {
  return value.trim().toLowerCase().replace(/:\d+$/, "");
}

function normalizeNullable(value: string | null | undefined): string | null {
  return value === undefined || value === null || value === "" ? null : value;
}

function nullablePatch(value: string | null | undefined): string | null | undefined {
  return value === undefined ? undefined : normalizeNullable(value);
}

function addUpdate(
  fields: string[],
  params: DatabaseQueryParam[],
  column: string,
  value: DatabaseQueryParam | undefined,
): void {
  if (value === undefined) return;
  fields.push(`${column} = ?`);
  params.push(value);
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
