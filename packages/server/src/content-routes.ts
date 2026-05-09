import type { FastifyInstance, FastifyReply } from "fastify";
import {
  canRoleAccess,
  createEntry,
  deleteEntry,
  type EntryListOptions,
  type EntryRecord,
  getEntryById,
  getSchemaBySlug,
  listEntries,
  queryEntries,
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
      if (!canAccess(database, request, schema, "getAll")) return forbidden(reply);
      let result: { entries: EntryRecord[]; limit?: number; offset?: number; total?: number };
      try {
        result = hasContentListQuery(request.query)
          ? queryEntries(database, schema.id, contentListOptions(request.query))
          : { entries: listEntries(database, schema.id) };
      } catch (error) {
        return sendContentError(reply, error, 400);
      }
      const entries = result.entries;
      if (!shouldPopulateRelations(request.query.populate)) {
        return { ok: true, schema: schema.slug, ...result, entries };
      }
      return {
        ok: true,
        schema: schema.slug,
        ...result,
        entries: entries.map((entry) =>
          populateEntryRelations(database, schema, entry, (targetSchema) =>
            canAccess(database, request, targetSchema, "get"),
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
      if (!canAccess(database, request, schema, "get")) return forbidden(reply);
      const entry = getEntryById(database, request.params.entryId);
      if (!entry || entry.schemaId !== schema.id) {
        return reply.code(404).send({ ok: false, error: "ENTRY_NOT_FOUND" });
      }
      let selectedEntry: EntryRecord;
      try {
        selectedEntry = projectContentEntry(schema, entry, parseFields(request.query.fields));
      } catch (error) {
        return sendContentError(reply, error, 400);
      }
      if (shouldPopulateRelations(request.query.populate)) {
        return {
          ok: true,
          entry: populateEntryRelations(database, schema, selectedEntry, (targetSchema) =>
            canAccess(database, request, targetSchema, "get"),
          ),
        };
      }
      return { ok: true, entry: selectedEntry };
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
  action: "getAll" | "get" | "create" | "update" | "delete",
): boolean {
  const roleId = request.headers["x-apiagex-role-id"];
  if (!roleId || Array.isArray(roleId)) return true;
  return canRoleAccess(database, roleId, schema.id, action);
}

function forbidden(reply: FastifyReply): FastifyReply {
  return reply.code(403).send({ ok: false, error: "API_PERMISSION_DENIED" });
}

function hasContentListQuery(query: ContentPopulateQuery): boolean {
  return Boolean(query.fields || query.limit || query.offset || query.search);
}

function contentListOptions(query: ContentPopulateQuery): EntryListOptions {
  const options: EntryListOptions = {};
  const fields = parseFields(query.fields);
  const limit = parsePositiveNumber(query.limit);
  const offset = parsePositiveNumber(query.offset);
  if (fields) options.fields = fields;
  if (limit !== undefined) options.limit = limit;
  if (offset !== undefined) options.offset = offset;
  if (query.search !== undefined) options.search = query.search;
  return options;
}

function parseFields(value: string | undefined): string[] | undefined {
  return value?.split(",").map((field) => field.trim()).filter(Boolean);
}

function parsePositiveNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function projectContentEntry(
  schema: SchemaRecord,
  entry: EntryRecord,
  fields: string[] | undefined,
): EntryRecord {
  if (!fields || fields.length === 0) return entry;
  const allowed = new Set(schema.fields.map((field) => field.slug));
  const data: EntryRecord["data"] = {};
  for (const field of [...new Set(fields)]) {
    if (!allowed.has(field)) throw new Error("ENTRY_FIELD_UNKNOWN");
    data[field] = entry.data[field];
  }
  return { ...entry, data };
}

function sendContentError(reply: FastifyReply, error: unknown, statusCode: number): FastifyReply {
  const message = error instanceof Error ? error.message : "CONTENT_REQUEST_FAILED";
  return reply.code(statusCode).send({ ok: false, error: message });
}
