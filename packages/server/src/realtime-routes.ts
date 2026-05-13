import type { FastifyInstance, FastifyReply } from "fastify";
import {
  canRoleAccess,
  createRealtimeSession,
  getSchemaBySlug,
  listRealtimeSettings,
  listRecentRealtimeEvents,
  listSchemas,
  resolveApiToken,
  setRealtimeConfig,
  type SqliteDatabase,
} from "apiagex-database";
import type { RealtimeBroker } from "./realtime-broker.type.js";
import type { RealtimeConfigBody, RealtimeConfigParams, RealtimeSessionBody } from "./realtime-routes.type.js";

export function registerRealtimeRoutes(
  server: FastifyInstance,
  database: SqliteDatabase,
  broker: RealtimeBroker,
): void {
  server.get("/api/admin/realtime", async () => ({
    ok: true,
    configs: listRealtimeSettings(database),
    connections: broker.snapshot(),
    events: listRecentRealtimeEvents(database),
    retention: { eventsPerSchema: broker.retentionEventsPerSchema },
    schemas: listSchemas(database),
  }));

  server.put<{ Body: RealtimeConfigBody; Params: RealtimeConfigParams }>(
    "/api/admin/realtime/:schemaId",
    async (request, reply) => {
      try {
        return {
          ok: true,
          config: setRealtimeConfig(database, {
            schemaId: request.params.schemaId,
            enabled: request.body.enabled,
            events: request.body.events,
          }),
        };
      } catch (error) {
        return sendRealtimeError(reply, error);
      }
    },
  );

  server.post<{ Body: RealtimeSessionBody }>("/api/realtime/session", async (request, reply) => {
    const body = (request.body ?? {}) as Partial<RealtimeSessionBody>;
    const schemaSlug = typeof body.schema === "string" ? body.schema.trim() : "";
    if (!schemaSlug) return reply.code(400).send({ ok: false, error: "SCHEMA_REQUIRED" });
    if (body.ttlSeconds !== undefined && !Number.isFinite(body.ttlSeconds)) {
      return reply.code(400).send({ ok: false, error: "REALTIME_TTL_INVALID" });
    }
    const schema = getSchemaBySlug(database, schemaSlug);
    if (!schema) return reply.code(404).send({ ok: false, error: "SCHEMA_NOT_FOUND" });
    const apiToken = resolveApiToken(database, bearerToken(request.headers.authorization));
    if (!apiToken) return reply.code(401).send({ ok: false, error: "API_TOKEN_INVALID" });
    if (!canRoleAccess(database, apiToken.roleId, schema.id, "getAll")) {
      return reply.code(403).send({ ok: false, error: "API_PERMISSION_DENIED" });
    }
    const input = {
      roleId: apiToken.roleId,
      schemaId: schema.id,
      schemaSlug: schema.slug,
      ...(body.ttlSeconds === undefined ? {} : { ttlSeconds: body.ttlSeconds }),
    };
    const created = createRealtimeSession(database, input);
    return { ok: true, token: created.token, expiresAt: created.session.expiresAt, tokenPrefix: created.session.tokenPrefix };
  });
}

function sendRealtimeError(reply: FastifyReply, error: unknown): FastifyReply {
  const message = error instanceof Error ? error.message : "REALTIME_REQUEST_FAILED";
  return reply.code(message === "SCHEMA_NOT_FOUND" ? 404 : 400).send({ ok: false, error: message });
}

function bearerToken(authorization: string | string[] | undefined): string {
  if (typeof authorization !== "string" || !authorization.toLowerCase().startsWith("bearer ")) return "";
  return authorization.slice(7).trim();
}
