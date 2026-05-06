import type { FastifyInstance, FastifyReply } from "fastify";
import {
  createSchema,
  deleteSchema,
  getSchemaById,
  listSchemas,
  updateSchema,
  type SqliteDatabase,
} from "@apiagex/database";
import type {
  SchemaCreateBody,
  SchemaParams,
  SchemaUpdateBody,
} from "./schema-routes.type.js";

export function registerSchemaRoutes(
  server: FastifyInstance,
  database: SqliteDatabase,
): void {
  server.get("/api/admin/schemas", async () => ({
    ok: true,
    schemas: listSchemas(database),
  }));

  server.post<{ Body: SchemaCreateBody }>("/api/admin/schemas", async (request, reply) => {
    try {
      return { ok: true, schema: createSchema(database, request.body) };
    } catch (error) {
      return sendSchemaError(reply, error, 400);
    }
  });

  server.get<{ Params: SchemaParams }>("/api/admin/schemas/:id", async (request, reply) => {
    const schema = getSchemaById(database, request.params.id);
    if (!schema) {
      return reply.code(404).send({ ok: false, error: "SCHEMA_NOT_FOUND" });
    }
    return { ok: true, schema };
  });

  server.put<{ Body: SchemaUpdateBody; Params: SchemaParams }>(
    "/api/admin/schemas/:id",
    async (request, reply) => {
      try {
        return {
          ok: true,
          schema: updateSchema(database, request.params.id, request.body),
        };
      } catch (error) {
        const statusCode = errorCode(error) === "SCHEMA_NOT_FOUND" ? 404 : 400;
        return sendSchemaError(reply, error, statusCode);
      }
    },
  );

  server.delete<{ Params: SchemaParams }>("/api/admin/schemas/:id", async (request, reply) => {
    try {
      deleteSchema(database, request.params.id);
      return { ok: true, deleted: true };
    } catch (error) {
      const statusCode = errorCode(error) === "SCHEMA_NOT_FOUND" ? 404 : 400;
      return sendSchemaError(reply, error, statusCode);
    }
  });
}

function sendSchemaError(reply: FastifyReply, error: unknown, statusCode: number): FastifyReply {
  return reply.code(statusCode).send({ ok: false, error: errorCode(error) });
}

function errorCode(error: unknown): string {
  return error instanceof Error ? error.message : "SCHEMA_REQUEST_FAILED";
}
