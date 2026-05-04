import Fastify from "fastify";
import type { ApiagexServer, HealthResponse } from "./app.type.js";

export function createServer(): ApiagexServer {
  const server = Fastify({ logger: false });

  server.get("/api/health", async (): Promise<HealthResponse> => ({
    ok: true,
    service: "apiagex",
    path: "/api/health",
  }));

  return server;
}
