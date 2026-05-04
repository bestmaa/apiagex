import Fastify from "fastify";
import { migrateMvpDatabase, openSqliteDatabase } from "@apiagex/database";
import type {
  ApiagexServer,
  ApiRootResponse,
  CreateServerOptions,
  HealthResponse,
} from "./app.type.js";
import { bootstrapOwner } from "./owner-bootstrap.js";

export function createServer(options: CreateServerOptions = {}): ApiagexServer {
  const server = Fastify({ logger: false });
  const database = options.database ?? openSqliteDatabase();
  migrateMvpDatabase(database);

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

  server.get("/doc", async (_request, reply) => {
    return reply.type("text/html").send(renderDocPage());
  });

  server.get("/readme", async (_request, reply) => {
    return reply.type("text/html").send(renderReadmePage());
  });

  server.get("/adminui", async (_request, reply) => {
    return reply.type("text/html").send(renderAdminPage());
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
      "Use /adminui for UI and /api for backend routes.",
    ].join(" "),
  );
}

function renderAdminPage(): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Apiagex Admin UI</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; color: #172033; }
    header { padding: 20px 28px; border-bottom: 1px solid #d7dce5; }
    nav { display: flex; gap: 12px; flex-wrap: wrap; padding: 16px 28px; }
    a { color: #1457d9; text-decoration: none; font-weight: 700; }
    main { padding: 20px 28px; max-width: 900px; }
  </style>
</head>
<body>
  <header><h1>Apiagex Admin UI</h1><p>Fresh MVP admin shell</p></header>
  <nav aria-label="Admin navigation">
    <a href="#dashboard">Dashboard</a>
    <a href="#schemas">Schemas</a>
    <a href="#apis">APIs</a>
    <a href="#roles">Roles</a>
    <a href="#users">Users</a>
    <a href="/doc">Docs</a>
  </nav>
  <main>
    <h2>Dashboard</h2>
    <p>English: Admin shell is ready for owner login, schema builder, APIs, roles, and users.</p>
    <p>Hinglish: Admin shell owner login, schema builder, APIs, roles, aur users ke liye ready hai.</p>
  </main>
</body>
</html>`;
}
