import Fastify from "fastify";
import type {
  ApiagexServer,
  ApiRootResponse,
  HealthResponse,
} from "./app.type.js";

export function createServer(): ApiagexServer {
  const server = Fastify({ logger: false });

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

  server.get("/doc", async (_request, reply) => {
    return reply.type("text/html").send(renderDocPage());
  });

  server.get("/readme", async (_request, reply) => {
    return reply.type("text/html").send(renderReadmePage());
  });

  server.get("/adminui", async (_request, reply) => {
    return reply.type("text/html").send(renderPage("Apiagex Admin UI", "Admin UI route ready"));
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
