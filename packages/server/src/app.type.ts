import type { FastifyInstance } from "fastify";
import type { ApiagexDatabase, SqliteDatabase } from "@apiagex/database";
import type { RegisterApiagexCustomRoutes } from "./custom-routes.type.js";
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
  database?: ApiagexDatabase | SqliteDatabase;
  databasePath?: string;
  customRoutes?: RegisterApiagexCustomRoutes;
  uploadsPath?: string;
  webhookHttpClient?: WebhookHttpClient;
};
