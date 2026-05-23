import type { TenantLookup, TenantRecord, TenantStatus } from "@apiagex/database";

export type TenantResolutionMode = "customDomain" | "subdomain" | "pathPrefix";

export type TenantResolutionOrder = "domain" | "subdomain" | "path";

export type TenantResolverConfig = {
  allowSlugSubdomain?: boolean | undefined;
  pathPrefix?: string | undefined;
  reservedSubdomains?: string[] | undefined;
  resolutionOrder?: TenantResolutionOrder[] | undefined;
  rootDomain?: string | undefined;
  trustProxy?: boolean | undefined;
};

export type TenantResolveRequest = {
  headers?: Record<string, string | string[] | undefined> | undefined;
  host?: string | undefined;
  path: string;
};

export type TenantResolverLookup = (lookup: TenantLookup) => Promise<TenantRecord | undefined>;

export type TenantResolutionResult =
  | {
      ok: true;
      mode: TenantResolutionMode;
      originalHost: string;
      originalPath: string;
      rewrittenPath: string;
      tenant: TenantRecord;
      tenantId: string;
      tenantSlug: string;
    }
  | {
      ok: false;
      error: TenantResolutionError;
      statusCode: number;
    };

export type TenantResolutionError =
  | "TENANT_ARCHIVED"
  | "TENANT_DOMAIN_CONFLICT"
  | "TENANT_FAILED"
  | "TENANT_HOST_INVALID"
  | "TENANT_MIGRATION_REQUIRED"
  | "TENANT_NOT_FOUND"
  | "TENANT_PATH_PREFIX_INVALID"
  | "TENANT_PROVISIONING"
  | "TENANT_RESERVED_SUBDOMAIN"
  | "TENANT_SUSPENDED";

const defaultOrder: TenantResolutionOrder[] = ["domain", "subdomain", "path"];
const defaultPathPrefix = "/t";
const defaultReservedSubdomains = ["www", "api", "admin", "platform", "status", "static", "assets", "docs"];
const slugPattern = /^[a-z][a-z0-9-]*$/;

export async function resolveTenant(
  request: TenantResolveRequest,
  config: TenantResolverConfig,
  lookupTenant: TenantResolverLookup,
): Promise<TenantResolutionResult> {
  const originalPath = request.path || "/";
  const originalHost = hostFromRequest(request, Boolean(config.trustProxy));
  const normalizedHost = normalizeHost(originalHost);
  if (!normalizedHost) return tenantError("TENANT_HOST_INVALID");
  const resolvedOriginalHost = originalHost ?? normalizedHost;
  for (const mode of config.resolutionOrder ?? defaultOrder) {
    if (mode === "domain") {
      const resolved = await resolveByDomain(normalizedHost, resolvedOriginalHost, originalPath, lookupTenant);
      if (resolved) return resolved;
    } else if (mode === "subdomain") {
      const resolved = await resolveBySubdomain(normalizedHost, resolvedOriginalHost, originalPath, config, lookupTenant);
      if (resolved) return resolved;
    } else {
      const resolved = await resolveByPathPrefix(normalizedHost, resolvedOriginalHost, originalPath, config, lookupTenant);
      if (resolved) return resolved;
    }
  }
  return tenantError("TENANT_NOT_FOUND");
}

export function normalizeHost(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const host = firstHeaderValue(value).trim().toLowerCase().replace(/:\d+$/, "");
  if (!isSafeHostname(host)) return undefined;
  return host;
}

export function statusError(status: TenantStatus): TenantResolutionError | undefined {
  if (status === "active") return undefined;
  if (status === "provisioning") return "TENANT_PROVISIONING";
  if (status === "suspended") return "TENANT_SUSPENDED";
  if (status === "migration_required") return "TENANT_MIGRATION_REQUIRED";
  if (status === "failed") return "TENANT_FAILED";
  return "TENANT_ARCHIVED";
}

function hostFromRequest(request: TenantResolveRequest, trustProxy: boolean): string | undefined {
  if (trustProxy) {
    const forwarded = firstHeaderValue(request.headers?.["x-forwarded-host"]);
    if (forwarded) return forwarded;
  }
  return request.host ?? firstHeaderValue(request.headers?.host);
}

async function resolveByDomain(
  host: string,
  originalHost: string,
  originalPath: string,
  lookupTenant: TenantResolverLookup,
): Promise<TenantResolutionResult | undefined> {
  const tenant = await lookupTenant({ domain: host });
  return tenant ? tenantResolution("customDomain", originalHost, originalPath, originalPath, tenant) : undefined;
}

async function resolveBySubdomain(
  host: string,
  originalHost: string,
  originalPath: string,
  config: TenantResolverConfig,
  lookupTenant: TenantResolverLookup,
): Promise<TenantResolutionResult | undefined> {
  const rootDomain = normalizeHost(config.rootDomain);
  if (!rootDomain || !host.endsWith(`.${rootDomain}`)) return undefined;
  const subdomain = host.slice(0, -(rootDomain.length + 1));
  if (!slugPattern.test(subdomain) || subdomain.includes(".")) return tenantError("TENANT_HOST_INVALID");
  const reserved = new Set((config.reservedSubdomains ?? defaultReservedSubdomains).map((item) => item.toLowerCase()));
  if (reserved.has(subdomain)) return tenantError("TENANT_RESERVED_SUBDOMAIN");
  const tenant = await lookupTenant({ subdomain })
    ?? (config.allowSlugSubdomain === false ? undefined : await lookupTenant({ slug: subdomain }));
  return tenant ? tenantResolution("subdomain", originalHost, originalPath, originalPath, tenant) : undefined;
}

async function resolveByPathPrefix(
  host: string,
  originalHost: string,
  originalPath: string,
  config: TenantResolverConfig,
  lookupTenant: TenantResolverLookup,
): Promise<TenantResolutionResult | undefined> {
  const prefix = normalizePathPrefix(config.pathPrefix ?? defaultPathPrefix);
  if (originalPath !== prefix && !originalPath.startsWith(`${prefix}/`)) return undefined;
  const rest = originalPath.slice(prefix.length).replace(/^\/+/, "");
  const [slug, ...remaining] = rest.split("/");
  if (!slug || !slugPattern.test(slug)) return tenantError("TENANT_PATH_PREFIX_INVALID");
  const tenant = await lookupTenant({ slug });
  const rewrittenPath = `/${remaining.join("/")}`.replace(/\/$/, "") || "/";
  return tenant ? tenantResolution("pathPrefix", originalHost, originalPath, rewrittenPath, tenant) : undefined;
}

function tenantResolution(
  mode: TenantResolutionMode,
  originalHost: string,
  originalPath: string,
  rewrittenPath: string,
  tenant: TenantRecord,
): TenantResolutionResult {
  const error = statusError(tenant.status);
  if (error) return tenantError(error);
  return {
    mode,
    ok: true,
    originalHost,
    originalPath,
    rewrittenPath,
    tenant,
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
  };
}

function tenantError(error: TenantResolutionError): TenantResolutionResult {
  return { error, ok: false, statusCode: tenantStatusCode(error) };
}

function tenantStatusCode(error: TenantResolutionError): number {
  if (error === "TENANT_HOST_INVALID" || error === "TENANT_PATH_PREFIX_INVALID") return 400;
  if (error === "TENANT_SUSPENDED") return 403;
  if (error === "TENANT_ARCHIVED") return 410;
  if (error === "TENANT_DOMAIN_CONFLICT") return 500;
  if (error === "TENANT_NOT_FOUND" || error === "TENANT_RESERVED_SUBDOMAIN") return 404;
  return 503;
}

function normalizePathPrefix(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "/") return defaultPathPrefix;
  return `/${trimmed.replace(/^\/+|\/+$/g, "")}`;
}

function firstHeaderValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function isSafeHostname(host: string): boolean {
  if (!host || host.length > 253 || host.includes("/") || /\s/.test(host)) return false;
  const labels = host.split(".");
  return labels.every((label) => (
    label.length > 0 &&
    label.length <= 63 &&
    /^[a-z0-9-]+$/.test(label) &&
    !label.startsWith("-") &&
    !label.endsWith("-")
  ));
}
