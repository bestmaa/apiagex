import type { FastifyInstance } from "fastify";
import type { ApiagexDatabase, SqliteDatabase } from "@apiagex/database";
import type { RegisterApiagexCustomRoutes } from "./custom-routes.type.js";
import type { TenantMetricsOptions, TenantRateLimitOptions } from "./tenant-observability.js";
import type { RegisterTenantContextOptions } from "./tenant-context.js";
import type { WebhookHttpClient } from "./webhook-dispatcher.type.js";

export type ApiagexServer = FastifyInstance;

export type HealthResponse = {
  ok: true;
  service: "apiagex";
  path: "/api/health";
};

export type ApiRootResponse = {
  ok: true;
  service: "apiagex";
  paths: string[];
};

export type CreateServerOptions = {
  adminAuth?: "disabled" | "required";
  apiLogMaxBytes?: number;
  apiLogsPath?: string;
  database?: ApiagexDatabase | SqliteDatabase;
  databasePath?: string;
  customRoutes?: RegisterApiagexCustomRoutes;
  multiTenant?: RegisterTenantContextOptions;
  projectEnvPath?: string;
  platformAdminToken?: string;
  tenantMetrics?: TenantMetricsOptions;
  tenantRateLimit?: TenantRateLimitOptions;
  uploadsPath?: string;
  webhookHttpClient?: WebhookHttpClient;
};
