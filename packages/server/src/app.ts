import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import {
  migrateMvpDatabase,
  openMigratedSqliteAdapter,
  wrapSqliteDatabase,
  type ApiagexDatabase,
  type SqliteDatabase,
} from "@apiagex/database";
import type {
  ApiagexServer,
  ApiRootResponse,
  CreateServerOptions,
  HealthResponse,
} from "./app.type.js";
import { bootstrapOwner, getOwnerStatus, loginOwner } from "./owner-bootstrap.js";
import { registerAdminAuthGuard, sendAdminSession } from "./admin-auth.js";
import { readAdminIndex, resolveAdminUiAsset } from "./admin-ui.js";
import { readDocsPage } from "./docs-ui.js";
import { registerContentRoutes } from "./content-routes.js";
import { registerSchemaRoutes } from "./schema-routes.js";
import { registerEntryRoutes } from "./entry-routes.js";
import { registerRoleRoutes } from "./role-routes.js";
import { registerUserRoutes } from "./user-routes.js";
import { registerSettingsRoutes } from "./settings-routes.js";
import { registerWebhookRoutes } from "./webhook-routes.js";
import { loginUser } from "./user-auth.js";
import { createRealtimeBroker } from "./realtime-broker.js";
import { registerRealtimeRoutes } from "./realtime-routes.js";
import { registerOpenApiRoutes } from "./openapi-routes.js";
import { registerProjectCustomRoutes } from "./custom-api-routes.js";
import { registerCustomApiAdminRoutes } from "./custom-api-admin-routes.js";
import { registerWorkflowRoutes } from "./workflow-api-routes.js";
import { registerWorkflowAdminRoutes } from "./workflow-admin-routes.js";
import { registerAutomationTokenRoutes } from "./automation-token-routes.js";
import { registerAiAutomationRoutes } from "./ai-automation-routes.js";
import { registerAiPlanRoutes } from "./ai-plan-routes.js";
import { registerProjectTemplateRoutes } from "./project-template-routes.js";
import { registerMediaRoutes } from "./media-routes.js";
import { buildTenantHealthDiagnostics } from "./tenant-health.js";
import type { ApiagexTenantContext } from "./tenant-context.js";
import { registerPlatformAdminAuthGuard } from "./platform-admin-auth.js";
import { registerTenantContext } from "./tenant-context.js";
import { registerTenantObservabilityHooks } from "./tenant-observability.js";
import { createRequestScopedDatabase, currentUploadsPath, registerRequestRuntime } from "./request-runtime.js";

export function createServer(options: CreateServerOptions = {}): ApiagexServer {
  const server = Fastify({ logger: false });
  const rootDatabase = resolveDatabase(options);
  const database = createRequestScopedDatabase(rootDatabase);
  const uploadsPath = resolve(options.uploadsPath ?? ".apiagex/uploads");
  mkdirSync(uploadsPath, { recursive: true });
  const realtimeBroker = createRealtimeBroker(database);
  realtimeBroker.attach(server);
  server.register(fastifyStatic, {
    prefix: "/adminui/",
    root: resolveAdminUiAsset().root,
  });
  server.register(fastifyStatic, {
    decorateReply: false,
    prefix: "/uploads/",
    root: uploadsPath,
  });
  if (options.multiTenant) registerTenantContext(server, options.multiTenant);
  registerTenantObservabilityHooks(server, {
    ...(options.tenantMetrics ? { metrics: options.tenantMetrics } : {}),
    ...(options.tenantRateLimit ? { rateLimit: options.tenantRateLimit } : {}),
  });
  registerRequestRuntime(server, { database: rootDatabase, uploadsPath });
  if (options.adminAuth !== "disabled") registerAdminAuthGuard(server, database);
  if (options.platformAdminToken) registerPlatformAdminAuthGuard(server, options.platformAdminToken);
  registerSchemaRoutes(server, database);
  const webhookOptions = options.webhookHttpClient ? { httpClient: options.webhookHttpClient } : {};
  registerEntryRoutes(server, database, uploadsPath, webhookOptions, realtimeBroker);
  registerContentRoutes(server, database, webhookOptions, realtimeBroker);
  registerRoleRoutes(server, database);
  registerUserRoutes(server, database);
  registerSettingsRoutes(server, database);
  registerMediaRoutes(server, uploadsPath);
  registerProjectTemplateRoutes(server, database);
  registerAutomationTokenRoutes(server, database, {
    ...(options.projectEnvPath === undefined ? {} : { projectEnvPath: options.projectEnvPath }),
  });
  registerAiAutomationRoutes(server, database);
  registerAiPlanRoutes(server, database);
  registerWebhookRoutes(server, database, webhookOptions);
  registerRealtimeRoutes(server, database, realtimeBroker);
  registerCustomApiAdminRoutes(server, database);
  registerWorkflowAdminRoutes(server, database);
  registerOpenApiRoutes(server, database);
  if (options.customRoutes) {
    registerProjectCustomRoutes(server, database, options.customRoutes);
  }
  registerWorkflowRoutes(server, database);

  server.get("/api", async (): Promise<ApiRootResponse> => ({
    ok: true,
    service: "apiagex",
    paths: ["/api", "/api/openapi.json", "/swagger", "/doc", "/readme", "/adminui", "/uploads"],
  }));

  server.get("/api/health", async (): Promise<HealthResponse> => ({
    ok: true,
    service: "apiagex",
    path: "/api/health",
  }));

  server.get("/api/admin/health/tenant", async (request) => {
    const tenantContext = (request as { apiagexTenant?: ApiagexTenantContext | null }).apiagexTenant;
    return {
      ok: true,
      diagnostics: await buildTenantHealthDiagnostics({
        database: tenantContext?.database ?? database,
        tenant: tenantContext?.tenant ?? null,
        uploadsPath: tenantContext?.uploadsPath ?? currentUploadsPath(uploadsPath),
      }),
    };
  });

  server.get("/favicon.ico", async (_request, reply) => reply.code(204).send());

  server.get("/api/auth/owner-status", async () => getOwnerStatus(database));

  server.post("/api/auth/bootstrap-owner", async (request, reply) => {
    try {
      return await bootstrapOwner(
        database,
        request.body as { email: string; password: string },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "OWNER_BOOTSTRAP_FAILED";
      const statusCode = message === "OWNER_ALREADY_BOOTSTRAPPED" ? 409 : 400;
      return reply.code(statusCode).send({ ok: false, error: message });
    }
  });

  server.post("/api/auth/login", async (request, reply) => {
    try {
      return await loginOwner(
        database,
        request.body as { email: string; password: string },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "OWNER_LOGIN_FAILED";
      return reply.code(401).send({ ok: false, error: message });
    }
  });

  server.post("/api/auth/login-user", async (request, reply) => {
    try {
      return await loginUser(
        database,
        request.body as { email: string; password: string },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "USER_LOGIN_FAILED";
      return reply.code(401).send({ ok: false, error: message });
    }
  });

  server.get("/api/auth/session", async (request, reply) => sendAdminSession(database, request, reply));

  server.get("/doc", async (_request, reply) => {
    return reply.type("text/html").send(await readDocsPage("doc"));
  });

  server.get("/readme", async (_request, reply) => {
    return reply.type("text/html").send(await readDocsPage("readme"));
  });

  server.get("/adminui", async (_request, reply) => {
    return reply.type("text/html").send(await readAdminIndex());
  });

  return server;
}

function resolveDatabase(options: CreateServerOptions): ApiagexDatabase {
  if (!options.database) return openMigratedSqliteAdapter(options.databasePath);
  if (isApiagexDatabase(options.database)) return options.database;
  migrateMvpDatabase(options.database);
  return wrapSqliteDatabase(options.database);
}

function isApiagexDatabase(database: ApiagexDatabase | SqliteDatabase): database is ApiagexDatabase {
  return "provider" in database;
}
