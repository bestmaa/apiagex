import type { FastifyInstance } from "fastify";
import type { ApiagexDatabase, SqliteDatabase } from "@apiagex/database";
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
  paths: ["/api", "/doc", "/readme", "/adminui"];
};

export type CreateServerOptions = {
  database?: ApiagexDatabase | SqliteDatabase;
  databasePath?: string;
  uploadsPath?: string;
  webhookHttpClient?: WebhookHttpClient;
};
