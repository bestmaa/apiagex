import type { FastifyInstance, FastifyReply } from "fastify";
import {
  canRoleAccess,
  createEntry,
  deleteEntry,
  getEntryById,
  getSchemaBySlug,
  listEntries,
  updateEntry,
  type SchemaRecord,
  type SqliteDatabase,
} from "@apiagex/database";
import type { FastifyRequest } from "fastify";
import type {
  ContentBody,
  ContentEntryParams,
  ContentListParams,
  ContentPopulateQuery,
} from "./content-routes.type.js";
import { populateEntryRelations, shouldPopulateRelations } from "./relation-populate.js";

export function registerContentRoutes(
  server: FastifyInstance,
  database: SqliteDatabase,
): void {
  server.get<{ Params: ContentListParams; Querystring: ContentPopulateQuery }>(
    "/api/content/:schemaSlug",
    async (request, reply) => {
      const schema = findSchema(database, request.params.schemaSlug, reply);
      if (!schema) return reply;
      if (!canAccess(database, request, schema, "read")) return forbidden(reply);
      const entries = listEntries(database, schema.id);
      if (!shouldPopulateRelations(request.query.populate)) {
        return { ok: true, schema: schema.slug, entries };
      }
      return {
        ok: true,
        schema: schema.slug,
        entries: entries.map((entry) =>
          populateEntryRelations(database, schema, entry, (targetSchema) =>
            canAccess(database, request, targetSchema, "read"),
          ),
        ),
      };
    },
  );

  server.post<{ Body: ContentBody; Params: ContentListParams }>(
    "/api/content/:schemaSlug",
    async (request, reply) => {
      const schema = findSchema(database, request.params.schemaSlug, reply);
      if (!schema) return reply;
      if (!canAccess(database, request, schema, "create")) return forbidden(reply);
      try {
        return { ok: true, entry: createEntry(database, { schemaId: schema.id, data: request.body.data }) };
      } catch (error) {
        return sendContentError(reply, error, 400);
      }
    },
  );

  server.get<{ Params: ContentEntryParams; Querystring: ContentPopulateQuery }>(
    "/api/content/:schemaSlug/:entryId",
    async (request, reply) => {
      const schema = findSchema(database, request.params.schemaSlug, reply);
      if (!schema) return reply;
      if (!canAccess(database, request, schema, "read")) return forbidden(reply);
      const entry = getEntryById(database, request.params.entryId);
      if (!entry || entry.schemaId !== schema.id) {
        return reply.code(404).send({ ok: false, error: "ENTRY_NOT_FOUND" });
      }
      if (shouldPopulateRelations(request.query.populate)) {
        return {
          ok: true,
          entry: populateEntryRelations(database, schema, entry, (targetSchema) =>
            canAccess(database, request, targetSchema, "read"),
          ),
        };
      }
      return { ok: true, entry };
    },
  );

  server.put<{ Body: ContentBody; Params: ContentEntryParams }>(
    "/api/content/:schemaSlug/:entryId",
    async (request, reply) => {
      const schema = findSchema(database, request.params.schemaSlug, reply);
      if (!schema) return reply;
      if (!canAccess(database, request, schema, "update")) return forbidden(reply);
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
      if (!canAccess(database, request, schema, "delete")) return forbidden(reply);
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

function canAccess(
  database: SqliteDatabase,
  request: FastifyRequest,
  schema: SchemaRecord,
  action: "read" | "create" | "update" | "delete",
): boolean {
  const roleId = request.headers["x-apiagex-role-id"];
  if (!roleId || Array.isArray(roleId)) return true;
  return canRoleAccess(database, roleId, schema.id, action);
}

function forbidden(reply: FastifyReply): FastifyReply {
  return reply.code(403).send({ ok: false, error: "API_PERMISSION_DENIED" });
}

function sendContentError(reply: FastifyReply, error: unknown, statusCode: number): FastifyReply {
  const message = error instanceof Error ? error.message : "CONTENT_REQUEST_FAILED";
  return reply.code(statusCode).send({ ok: false, error: message });
}
