import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ApiagexDatabase, TenantLookup, TenantRecord } from "@apiagex/database";
import {
  resolveTenant,
  type TenantResolverConfig,
  type TenantResolverLookup,
  type TenantResolutionResult,
} from "./tenant-resolver.js";

export type ApiagexTenantContext = {
  database: ApiagexDatabase;
  originalPath: string;
  rewrittenPath: string;
  tenant: TenantRecord;
  tenantId: string;
  tenantSlug: string;
  uploadsPath: string;
};

export type RegisterTenantContextOptions = {
  enabled: boolean;
  getTenantDatabase: (tenant: TenantRecord) => Promise<ApiagexDatabase>;
  getTenantUploadsPath: (tenant: TenantRecord) => string;
  lookupTenant: TenantResolverLookup;
  resolver: TenantResolverConfig;
  skipPaths?: string[] | undefined;
};

declare module "fastify" {
  interface FastifyRequest {
    apiagexTenant: ApiagexTenantContext | null;
  }
}

export function registerTenantContext(
  server: FastifyInstance,
  options: RegisterTenantContextOptions,
): void {
  server.decorateRequest("apiagexTenant", null);
  if (!options.enabled) return;
  server.addHook("onRequest", async (request, reply) => {
    if (shouldSkipTenantContext(request.url, options.skipPaths)) return;
    const result = await resolveTenant(
      {
        headers: stringHeaders(request.headers),
        host: request.headers.host,
        path: request.url.split("?")[0] || "/",
      },
      options.resolver,
      options.lookupTenant,
    );
    if (!result.ok) {
      sendTenantResolutionError(reply, result);
      return;
    }
    request.apiagexTenant = {
      database: await options.getTenantDatabase(result.tenant),
      originalPath: result.originalPath,
      rewrittenPath: result.rewrittenPath,
      tenant: result.tenant,
      tenantId: result.tenantId,
      tenantSlug: result.tenantSlug,
      uploadsPath: options.getTenantUploadsPath(result.tenant),
    };
  });
}

export function requireTenantContext(request: FastifyRequest): ApiagexTenantContext {
  if (!request.apiagexTenant) throw new Error("TENANT_CONTEXT_REQUIRED");
  return request.apiagexTenant;
}

function sendTenantResolutionError(reply: FastifyReply, result: Extract<TenantResolutionResult, { ok: false }>): void {
  reply.code(result.statusCode).send({ ok: false, error: result.error });
}

function shouldSkipTenantContext(url: string, skipPaths: string[] | undefined): boolean {
  if (!skipPaths?.length) return false;
  const path = url.split("?")[0] || "/";
  return skipPaths.some((skipPath) => path === skipPath || path.startsWith(`${skipPath}/`));
}

function stringHeaders(headers: FastifyRequest["headers"]): Record<string, string | string[] | undefined> {
  const next: Record<string, string | string[] | undefined> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (typeof value === "string" || Array.isArray(value)) next[key] = value;
  }
  return next;
}

export function tenantLookupFromRecords(tenants: TenantRecord[]): TenantResolverLookup {
  return async (lookup: TenantLookup) => {
    if (lookup.id) return tenants.find((tenant) => tenant.id === lookup.id);
    if (lookup.slug) return tenants.find((tenant) => tenant.slug === lookup.slug);
    if (lookup.subdomain) return tenants.find((tenant) => tenant.subdomain === lookup.subdomain);
    if (lookup.domain) return tenants.find((tenant) => tenant.primaryDomain === lookup.domain);
    return undefined;
  };
}
