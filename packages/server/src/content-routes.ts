import type { FastifyInstance, FastifyReply } from "fastify";
import {
  createEntry,
  deleteEntry,
  getEntryById,
  getSchemaBySlug,
  listEntries,
  updateEntry,
  type SchemaRecord,
  type SqliteDatabase,
} from "@apiagex/database";
import type {
  ContentBody,
  ContentEntryParams,
  ContentListParams,
} from "./content-routes.type.js";

export function registerContentRoutes(
  server: FastifyInstance,
  database: SqliteDatabase,
): void {
  server.get<{ Params: ContentListParams }>("/api/content/:schemaSlug", async (request, reply) => {
    const schema = findSchema(database, request.params.schemaSlug, reply);
    if (!schema) return reply;
    return { ok: true, schema: schema.slug, entries: listEntries(database, schema.id) };
  });

  server.post<{ Body: ContentBody; Params: ContentListParams }>(
    "/api/content/:schemaSlug",
    async (request, reply) => {
      const schema = findSchema(database, request.params.schemaSlug, reply);
      if (!schema) return reply;
      try {
        return { ok: true, entry: createEntry(database, { schemaId: schema.id, data: request.body.data }) };
      } catch (error) {
        return sendContentError(reply, error, 400);
      }
    },
  );

  server.get<{ Params: ContentEntryParams }>(
    "/api/content/:schemaSlug/:entryId",
    async (request, reply) => {
      const schema = findSchema(database, request.params.schemaSlug, reply);
      if (!schema) return reply;
      const entry = getEntryById(database, request.params.entryId);
      if (!entry || entry.schemaId !== schema.id) {
        return reply.code(404).send({ ok: false, error: "ENTRY_NOT_FOUND" });
      }
      return { ok: true, entry };
    },
  );

  server.put<{ Body: ContentBody; Params: ContentEntryParams }>(
    "/api/content/:schemaSlug/:entryId",
    async (request, reply) => {
      const schema = findSchema(database, request.params.schemaSlug, reply);
      if (!schema) return reply;
      if (!entryBelongsToSchema(database, request.params.entryId, schema.id)) {
        return reply.code(404).send({ ok: false, error: "ENTRY_NOT_FOUND" });
      }
      try {
        return { ok: true, entry: updateEntry(database, request.params.entryId, request.body) };
      } catch (error) {
        return sendContentError(reply, error, 400);
      }
    },
  );

  server.delete<{ Params: ContentEntryParams }>(
    "/api/content/:schemaSlug/:entryId",
    async (request, reply) => {
      const schema = findSchema(database, request.params.schemaSlug, reply);
      if (!schema) return reply;
      if (!entryBelongsToSchema(database, request.params.entryId, schema.id)) {
        return reply.code(404).send({ ok: false, error: "ENTRY_NOT_FOUND" });
      }
      deleteEntry(database, request.params.entryId);
      return { ok: true, deleted: true };
    },
  );
}

function findSchema(
  database: SqliteDatabase,
  slug: string,
  reply: FastifyReply,
): SchemaRecord | undefined {
  const schema = getSchemaBySlug(database, slug);
  if (!schema) {
    reply.code(404).send({ ok: false, error: "SCHEMA_NOT_FOUND" });
  }
  return schema;
}

function entryBelongsToSchema(database: SqliteDatabase, entryId: string, schemaId: string): boolean {
  const entry = getEntryById(database, entryId);
  return Boolean(entry && entry.schemaId === schemaId);
}

function sendContentError(reply: FastifyReply, error: unknown, statusCode: number): FastifyReply {
  const message = error instanceof Error ? error.message : "CONTENT_REQUEST_FAILED";
  return reply.code(statusCode).send({ ok: false, error: message });
}
