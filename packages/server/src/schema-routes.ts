import type { FastifyInstance, FastifyReply } from "fastify";
import {
  createSchema,
  deleteSchema,
  getSchemaById,
  listSchemas,
  updateSchema,
  type ApiagexDatabase,
  type FieldRecord,
  type SchemaRecord,
} from "@apiagex/database";
import type {
  SchemaFieldResponse,
  SchemaCreateBody,
  SchemaParams,
  SchemaResponseRecord,
  SchemaUpdateBody,
} from "./schema-routes.type.js";

export function registerSchemaRoutes(
  server: FastifyInstance,
  database: ApiagexDatabase,
): void {
  server.get("/api/admin/schemas", async () => ({
    ok: true,
    schemas: await Promise.all((await listSchemas(database)).map((schema) => toSchemaResponse(database, schema))),
  }));

  server.post<{ Body: SchemaCreateBody }>("/api/admin/schemas", async (request, reply) => {
    try {
      return {
        ok: true,
        schema: await toSchemaResponse(database, await createSchema(database, request.body)),
      };
    } catch (error) {
      return sendSchemaError(reply, error, 400);
    }
  });

  server.get<{ Params: SchemaParams }>("/api/admin/schemas/:id", async (request, reply) => {
    const schema = await getSchemaById(database, request.params.id);
    if (!schema) {
      return reply.code(404).send({ ok: false, error: "SCHEMA_NOT_FOUND" });
    }
    return { ok: true, schema: await toSchemaResponse(database, schema) };
  });

  server.put<{ Body: SchemaUpdateBody; Params: SchemaParams }>(
    "/api/admin/schemas/:id",
    async (request, reply) => {
      try {
        return {
          ok: true,
          schema: await toSchemaResponse(database, await updateSchema(database, request.params.id, request.body)),
        };
      } catch (error) {
        const statusCode = errorCode(error) === "SCHEMA_NOT_FOUND" ? 404 : 400;
        return sendSchemaError(reply, error, statusCode);
      }
    },
  );

  server.delete<{ Params: SchemaParams }>("/api/admin/schemas/:id", async (request, reply) => {
    try {
      await deleteSchema(database, request.params.id);
      return { ok: true, deleted: true };
    } catch (error) {
      const statusCode = errorCode(error) === "SCHEMA_NOT_FOUND" ? 404 : 400;
      return sendSchemaError(reply, error, statusCode);
    }
  });
}

async function toSchemaResponse(database: ApiagexDatabase, schema: SchemaRecord): Promise<SchemaResponseRecord> {
  return {
    ...schema,
    fields: await Promise.all(schema.fields.map((field) => toFieldResponse(database, field))),
  };
}

async function toFieldResponse(database: ApiagexDatabase, field: FieldRecord): Promise<SchemaFieldResponse> {
  if (field.type !== "relation" || !field.relationSchemaId) return field;
  const target = await getSchemaById(database, field.relationSchemaId);
  if (!target) return field;
  return {
    ...field,
    relationTarget: {
      id: target.id,
      name: target.name,
      slug: target.slug,
    },
  };
}

function sendSchemaError(reply: FastifyReply, error: unknown, statusCode: number): FastifyReply {
  return reply.code(statusCode).send({ ok: false, error: errorCode(error) });
}

function errorCode(error: unknown): string {
  return error instanceof Error ? error.message : "SCHEMA_REQUEST_FAILED";
}
