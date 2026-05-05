import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { migrateMvpDatabase, openSqliteDatabase } from "@apiagex/database";
import type {
  ApiagexServer,
  ApiRootResponse,
  CreateServerOptions,
  HealthResponse,
} from "./app.type.js";
import { bootstrapOwner, loginOwner } from "./owner-bootstrap.js";
import { readAdminIndex, resolveAdminUiAsset } from "./admin-ui.js";
import { readDocsPage } from "./docs-ui.js";
import { registerContentRoutes } from "./content-routes.js";
import { registerSchemaRoutes } from "./schema-routes.js";
import { registerEntryRoutes } from "./entry-routes.js";
import { registerRoleRoutes } from "./role-routes.js";
import { registerUserRoutes } from "./user-routes.js";
import { loginUser } from "./user-auth.js";

export function createServer(options: CreateServerOptions = {}): ApiagexServer {
  const server = Fastify({ logger: false });
  const database = options.database ?? openSqliteDatabase();
  migrateMvpDatabase(database);
  server.register(fastifyStatic, {
    prefix: "/adminui/",
    root: resolveAdminUiAsset().root,
  });
  registerSchemaRoutes(server, database);
  registerEntryRoutes(server, database);
  registerContentRoutes(server, database);
  registerRoleRoutes(server, database);
  registerUserRoutes(server, database);

  server.get("/api", async (): Promise<ApiRootResponse> => ({
    ok: true,
    service: "apiagex",
    paths: ["/api", "/doc", "/readme", "/adminui"],
  }));

  server.get("/api/health", async (): Promise<HealthResponse> => ({
    ok: true,
    service: "apiagex",
    path: "/api/health",
  }));

  server.post("/api/auth/bootstrap-owner", async (request, reply) => {
    try {
      return bootstrapOwner(
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
      return loginOwner(
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
      return loginUser(
        database,
        request.body as { email: string; password: string },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "USER_LOGIN_FAILED";
      return reply.code(401).send({ ok: false, error: message });
    }
  });

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
