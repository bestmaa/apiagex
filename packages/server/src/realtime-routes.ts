import type { FastifyInstance, FastifyReply } from "fastify";
import {
  listRealtimeSettings,
  listRecentRealtimeEvents,
  listSchemas,
  setRealtimeConfig,
  type SqliteDatabase,
} from "@apiagex/database";
import type { RealtimeBroker } from "./realtime-broker.type.js";
import type { RealtimeConfigBody, RealtimeConfigParams } from "./realtime-routes.type.js";

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
}

function sendRealtimeError(reply: FastifyReply, error: unknown): FastifyReply {
  const message = error instanceof Error ? error.message : "REALTIME_REQUEST_FAILED";
  return reply.code(message === "SCHEMA_NOT_FOUND" ? 404 : 400).send({ ok: false, error: message });
}
