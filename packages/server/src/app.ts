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
    return reply.type("text/html").send(renderPage("Apiagex Docs", "Docs route ready"));
  });

  server.get("/readme", async (_request, reply) => {
    return reply.type("text/html").send(renderPage("Apiagex Readme", "Readme route ready"));
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
