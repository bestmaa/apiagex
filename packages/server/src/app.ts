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

export function createServer(options: CreateServerOptions = {}): ApiagexServer {
  const server = Fastify({ logger: false });
  const database = options.database ?? openSqliteDatabase();
  migrateMvpDatabase(database);
  server.register(fastifyStatic, {
    prefix: "/adminui/",
    root: resolveAdminUiAsset().root,
  });

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

  server.get("/doc", async (_request, reply) => {
    return reply.type("text/html").send(renderDocPage());
  });

  server.get("/readme", async (_request, reply) => {
    return reply.type("text/html").send(renderReadmePage());
  });

  server.get("/adminui", async (_request, reply) => {
    return reply.type("text/html").send(await readAdminIndex());
  });

  return server;
}

function renderPage(title: string, message: string): string {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${title}</title></head>
<body><main><h1>${title}</h1><p>${message}</p></main></body>
</html>`;
}

function renderDocPage(): string {
  return renderPage(
    "Apiagex Docs",
    [
      "English: Completed MVP base paths are /api, /api/health, /doc, /readme, and /adminui.",
      "Hinglish: Completed MVP base paths /api, /api/health, /doc, /readme, aur /adminui hain.",
      "Owner auth: POST /api/auth/bootstrap-owner creates the first owner, then POST /api/auth/login logs in.",
      "Owner auth: POST /api/auth/bootstrap-owner pehla owner banata hai, phir POST /api/auth/login login karta hai.",
      "Next: owner bootstrap, schema builder, dynamic APIs, roles, permissions, and users.",
    ].join(" "),
  );
}

function renderReadmePage(): string {
  return renderPage(
    "Apiagex Readme",
    [
      "English: Apiagex is a fresh MVP headless CMS/API platform on one server.",
      "Hinglish: Apiagex ek fresh MVP headless CMS/API platform hai jo ek server par chalega.",
      "Use /adminui for React UI and /api for backend routes.",
      "Owner login starts in /adminui and uses the bootstrap/login APIs.",
    ].join(" "),
  );
}
