import type { FastifyInstance } from "fastify";

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
