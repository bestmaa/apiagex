import type { FastifyInstance, FastifyRequest } from "fastify";
import type { TenantStatus } from "@apiagex/database";
import type { ApiagexTenantContext } from "./tenant-context.js";

export type TenantMetricsLabels = {
  tenantId: string;
  tenantSlug: string;
  tenantStatus?: TenantStatus;
};

export type TenantRateLimitDecision = {
  allowed: false;
  error?: string;
  retryAfterSeconds?: number;
  statusCode?: number;
} | {
  allowed: true;
};

export type TenantRateLimitHookInput = {
  labels: TenantMetricsLabels | null;
  method: string;
  path: string;
};

export type TenantMetricsHookInput = TenantRateLimitHookInput & {
  error?: string;
  statusCode?: number;
};

export type TenantRateLimitOptions = {
  check: (input: TenantRateLimitHookInput) => Promise<TenantRateLimitDecision | void> | TenantRateLimitDecision | void;
};

export type TenantMetricsOptions = {
  onError?: (input: TenantMetricsHookInput) => Promise<void> | void;
  onResponse?: (input: TenantMetricsHookInput) => Promise<void> | void;
};

export type TenantObservabilityOptions = {
  metrics?: TenantMetricsOptions;
  rateLimit?: TenantRateLimitOptions;
};

export function registerTenantObservabilityHooks(
  server: FastifyInstance,
  options: TenantObservabilityOptions,
): void {
  if (options.rateLimit) {
    server.addHook("preHandler", async (request, reply) => {
      const decision = await options.rateLimit?.check(tenantHookInput(request));
      if (!decision || decision.allowed) return;
      if (decision.retryAfterSeconds !== undefined) reply.header("retry-after", String(decision.retryAfterSeconds));
      return reply.code(decision.statusCode ?? 429).send({ ok: false, error: decision.error ?? "TENANT_RATE_LIMITED" });
    });
  }
  if (options.metrics?.onResponse) {
    server.addHook("onResponse", async (request, reply) => {
      await options.metrics?.onResponse?.({
        ...tenantHookInput(request),
        statusCode: reply.statusCode,
      });
    });
  }
  if (options.metrics?.onError) {
    server.addHook("onError", async (request, _reply, error) => {
      await options.metrics?.onError?.({
        ...tenantHookInput(request),
        error: error.message,
      });
    });
  }
}

export function tenantMetricsLabels(request: FastifyRequest): TenantMetricsLabels | null {
  const tenantContext = (request as { apiagexTenant?: ApiagexTenantContext | null }).apiagexTenant;
  if (!tenantContext) return null;
  return {
    tenantId: tenantContext.tenantId,
    tenantSlug: tenantContext.tenantSlug,
    ...(tenantContext.tenant.status ? { tenantStatus: tenantContext.tenant.status } : {}),
  };
}

function tenantHookInput(request: FastifyRequest): TenantRateLimitHookInput {
  return {
    labels: tenantMetricsLabels(request),
    method: request.method,
    path: request.url.split("?")[0] || "/",
  };
}
