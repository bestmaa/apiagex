import type { FastifyInstance } from "fastify";
import { listApiRequestLogs, type ApiRequestLogOptions } from "./api-request-log.js";

type ApiLogQuery = {
  limit?: string;
};

export function registerApiLogRoutes(server: FastifyInstance, options: ApiRequestLogOptions): void {
  server.get<{ Querystring: ApiLogQuery }>("/api/admin/api-logs", async (request) => ({
    ok: true,
    ...(await listApiRequestLogs(options, parseLimit(request.query.limit))),
  }));
}

function parseLimit(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
