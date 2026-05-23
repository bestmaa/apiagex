import type { FastifyInstance, FastifyReply } from "fastify";
import {
  createAutomationToken,
  createTenant,
  encryptTenantSecret,
  getTenantById,
  listTenants,
  recordTenantAuditEvent,
  TENANT_STATUSES,
  toSafeTenant,
  updateTenant,
  type ApiagexDatabase,
  type TenantDatabaseProvider,
  type TenantSafeRecord,
  type TenantSecretKey,
  type TenantStatus,
} from "@apiagex/database";

export type CreatePlatformTenantBody = {
  databaseProvider?: TenantDatabaseProvider | undefined;
  databaseUrl?: string | undefined;
  displayName?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
  plan?: string | null | undefined;
  primaryDomain?: string | null | undefined;
  slug?: string | undefined;
  subdomain?: string | null | undefined;
  uploadsPath?: string | undefined;
};

export type PlatformTenantResponse = {
  ok: true;
  tenant: TenantSafeRecord;
};

export type PlatformTenantListResponse = {
  ok: true;
  tenants: TenantSafeRecord[];
};

export type RegisterPlatformTenantRoutesOptions = {
  getTenantDatabase?: ((tenant: { id: string; slug: string }) => Promise<ApiagexDatabase>) | undefined;
  onTenantSecretRotated?: ((tenantId: string) => void | Promise<void>) | undefined;
  secretKey: TenantSecretKey;
};

type ParsedCreatePlatformTenantBody = Omit<CreatePlatformTenantBody,
  "databaseProvider" | "databaseUrl" | "displayName" | "slug" | "uploadsPath"
> & {
  databaseProvider: TenantDatabaseProvider;
  databaseUrl: string;
  displayName: string;
  slug: string;
  uploadsPath: string;
};

export function registerPlatformTenantRoutes(
  server: FastifyInstance,
  platformDb: ApiagexDatabase,
  options: RegisterPlatformTenantRoutesOptions,
): void {
  server.get("/api/platform/tenants", async (): Promise<PlatformTenantListResponse> => {
    const tenants = await listTenants(platformDb);
    return { ok: true, tenants: tenants.map(toSafeTenant) };
  });

  server.get("/api/platform/tenants/:id", async (request, reply): Promise<FastifyReply | PlatformTenantResponse> => {
    const tenant = await getTenantById(platformDb, (request.params as { id: string }).id);
    if (!tenant) return reply.code(404).send({ ok: false, error: "TENANT_NOT_FOUND" });
    return { ok: true, tenant: toSafeTenant(tenant) };
  });

  server.post("/api/platform/tenants", async (request, reply): Promise<FastifyReply | PlatformTenantResponse> => {
    try {
      const input = parseCreateTenantBody(request.body);
      const tenant = await createTenant(platformDb, {
        databaseProvider: input.databaseProvider,
        databaseUrlEncrypted: encryptTenantSecret(input.databaseUrl, options.secretKey),
        displayName: input.displayName,
        metadata: input.metadata,
        plan: input.plan,
        primaryDomain: input.primaryDomain,
        slug: input.slug,
        status: "active",
        subdomain: input.subdomain,
        uploadsPath: input.uploadsPath,
      });
      await recordTenantAuditEvent(platformDb, {
        action: "tenant.created",
        metadata: {
          databaseProvider: tenant.databaseProvider,
          slug: tenant.slug,
        },
        tenantId: tenant.id,
      });
      return { ok: true, tenant: toSafeTenant(tenant) };
    } catch (error) {
      const message = error instanceof Error ? error.message : "TENANT_CREATE_FAILED";
      return reply.code(statusForTenantCreateError(message)).send({ ok: false, error: message });
    }
  });

  server.patch(
    "/api/platform/tenants/:id/status",
    async (request, reply): Promise<FastifyReply | PlatformTenantResponse> => {
      try {
        const status = parseTenantStatusBody(request.body);
        const tenant = await updateTenant(platformDb, (request.params as { id: string }).id, { status });
        await recordTenantAuditEvent(platformDb, {
          action: "tenant.status.updated",
          metadata: { status },
          tenantId: tenant.id,
        });
        return { ok: true, tenant: toSafeTenant(tenant) };
      } catch (error) {
        const message = error instanceof Error ? error.message : "TENANT_STATUS_UPDATE_FAILED";
        const statusCode = message === "TENANT_NOT_FOUND" ? 404 : 400;
        return reply.code(statusCode).send({ ok: false, error: message });
      }
    },
  );

  server.post(
    "/api/platform/tenants/:id/reprovision",
    async (request, reply): Promise<FastifyReply | PlatformTenantResponse> => {
      try {
        const tenant = await getTenantById(platformDb, (request.params as { id: string }).id);
        if (!tenant) throw new Error("TENANT_NOT_FOUND");
        if (tenant.status !== "failed") throw new Error("TENANT_REPROVISION_REQUIRES_FAILED_STATUS");
        const updated = await updateTenant(platformDb, tenant.id, {
          lastProvisioningError: null,
          status: "provisioning",
        });
        await recordTenantAuditEvent(platformDb, {
          action: "tenant.reprovision.requested",
          metadata: { cleanup: "not_attempted" },
          tenantId: tenant.id,
        });
        return { ok: true, tenant: toSafeTenant(updated) };
      } catch (error) {
        const message = error instanceof Error ? error.message : "TENANT_REPROVISION_FAILED";
        const statusCode = message === "TENANT_NOT_FOUND" ? 404 : 400;
        return reply.code(statusCode).send({ ok: false, error: message });
      }
    },
  );

  server.post(
    "/api/platform/tenants/:id/rotate-secret",
    async (request, reply): Promise<FastifyReply | PlatformTenantResponse> => {
      try {
        const databaseUrl = parseRotateSecretBody(request.body);
        const tenant = await getTenantById(platformDb, (request.params as { id: string }).id);
        if (!tenant) throw new Error("TENANT_NOT_FOUND");
        const updated = await updateTenant(platformDb, tenant.id, {
          databaseUrlEncrypted: encryptTenantSecret(databaseUrl, options.secretKey),
        });
        await options.onTenantSecretRotated?.(tenant.id);
        await recordTenantAuditEvent(platformDb, {
          action: "tenant.secret.rotated",
          metadata: {
            databaseProvider: tenant.databaseProvider,
            connectionCache: "invalidated",
          },
          tenantId: tenant.id,
        });
        return { ok: true, tenant: toSafeTenant(updated) };
      } catch (error) {
        const message = error instanceof Error ? error.message : "TENANT_SECRET_ROTATION_FAILED";
        const statusCode = message === "TENANT_NOT_FOUND" ? 404 : 400;
        return reply.code(statusCode).send({ ok: false, error: message });
      }
    },
  );

  server.post(
    "/api/platform/tenants/:id/automation-token",
    async (request, reply) => {
      try {
        if (!options.getTenantDatabase) throw new Error("TENANT_DATABASE_RESOLVER_REQUIRED");
        const tenant = await getTenantById(platformDb, (request.params as { id: string }).id);
        if (!tenant) throw new Error("TENANT_NOT_FOUND");
        const body = parseTenantAutomationTokenBody(request.body);
        const tenantDb = await options.getTenantDatabase({ id: tenant.id, slug: tenant.slug });
        const created = await createAutomationToken(tenantDb, {
          name: body.name,
          scopes: body.scopes,
          ttlMinutes: body.ttlMinutes,
        });
        await recordTenantAuditEvent(platformDb, {
          action: "tenant.automation_token.created",
          metadata: {
            scopes: body.scopes,
            tokenPrefix: created.tokenRecord.tokenPrefix,
          },
          tenantId: tenant.id,
        });
        return { ok: true, ...created };
      } catch (error) {
        const message = error instanceof Error ? error.message : "TENANT_AUTOMATION_TOKEN_CREATE_FAILED";
        const statusCode = message === "TENANT_NOT_FOUND" ? 404 : 400;
        return reply.code(statusCode).send({ ok: false, error: message });
      }
    },
  );
}

function parseCreateTenantBody(body: unknown): ParsedCreatePlatformTenantBody {
  if (!body || typeof body !== "object") throw new Error("TENANT_CREATE_BODY_INVALID");
  const value = body as CreatePlatformTenantBody;
  if (!value.slug || !value.displayName || !value.databaseProvider || !value.databaseUrl || !value.uploadsPath) {
    throw new Error("TENANT_CREATE_REQUIRED_FIELDS_MISSING");
  }
  return {
    databaseProvider: value.databaseProvider,
    databaseUrl: value.databaseUrl,
    displayName: value.displayName,
    metadata: value.metadata,
    plan: value.plan,
    primaryDomain: value.primaryDomain,
    slug: value.slug,
    subdomain: value.subdomain,
    uploadsPath: value.uploadsPath,
  };
}

function statusForTenantCreateError(message: string): number {
  if (message.includes("UNIQUE") || message.includes("unique")) return 409;
  if (message.startsWith("TENANT_")) return 400;
  return 500;
}

function parseTenantStatusBody(body: unknown): TenantStatus {
  if (!body || typeof body !== "object") throw new Error("TENANT_STATUS_BODY_INVALID");
  const status = (body as { status?: unknown }).status;
  if (typeof status !== "string" || !TENANT_STATUSES.includes(status as TenantStatus)) {
    throw new Error("TENANT_STATUS_INVALID");
  }
  return status as TenantStatus;
}

function parseRotateSecretBody(body: unknown): string {
  if (!body || typeof body !== "object") throw new Error("TENANT_SECRET_ROTATION_BODY_INVALID");
  const databaseUrl = (body as { databaseUrl?: unknown }).databaseUrl;
  if (typeof databaseUrl !== "string" || !databaseUrl.trim()) {
    throw new Error("TENANT_SECRET_ROTATION_DATABASE_URL_REQUIRED");
  }
  return databaseUrl;
}

function parseTenantAutomationTokenBody(body: unknown): {
  name: string;
  scopes: Array<"schemas:manage" | "workflows:manage" | "permissions:manage" | "routes:read" | "plans:apply">;
  ttlMinutes: number;
} {
  if (!body || typeof body !== "object") throw new Error("TENANT_AUTOMATION_TOKEN_BODY_INVALID");
  const value = body as { name?: unknown; scopes?: unknown; ttlMinutes?: unknown };
  if (typeof value.name !== "string" || !value.name.trim()) throw new Error("TENANT_AUTOMATION_TOKEN_NAME_REQUIRED");
  if (!Array.isArray(value.scopes)) throw new Error("TENANT_AUTOMATION_TOKEN_SCOPES_REQUIRED");
  return {
    name: value.name,
    scopes: value.scopes as Array<"schemas:manage" | "workflows:manage" | "permissions:manage" | "routes:read" | "plans:apply">,
    ttlMinutes: typeof value.ttlMinutes === "number" ? value.ttlMinutes : 60,
  };
}
