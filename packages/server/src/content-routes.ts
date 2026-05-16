import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  canRoleAccess,
  createEntry,
  deleteEntry,
  getEntryById,
  getSchemaBySlug,
  listRoles,
  listEntries,
  queryEntries,
  resolveApiToken,
  updateEntry,
  type ApiagexDatabase,
  type EntryListOptions,
  type EntryRecord,
  type SchemaRecord,
} from "@apiagex/database";
import type {
  ContentBody,
  ContentEntryParams,
  ContentListParams,
  ContentPopulateQuery,
} from "./content-routes.type.js";
import { emitEntryMutationWebhook } from "./entry-webhooks.js";
import { emitEntryRealtime } from "./entry-realtime.js";
import { populateEntryRelations, shouldPopulateRelations, type PopulatedEntryRecord } from "./relation-populate.js";
import type { RealtimeBroker } from "./realtime-broker.type.js";
import type { WebhookDispatcherOptions } from "./webhook-dispatcher.type.js";

export function registerContentRoutes(
  server: FastifyInstance,
  database: ApiagexDatabase,
  webhookOptions: WebhookDispatcherOptions = {},
  realtimeBroker?: RealtimeBroker,
): void {
  server.get<{ Params: ContentListParams; Querystring: ContentPopulateQuery }>(
    "/api/content/:schemaSlug",
    async (request, reply) => {
      const schema = await findSchema(database, request.params.schemaSlug, reply);
      if (!schema) return reply;
      const access = await canAccess(database, request, schema, "getAll");
      if (!access.allowed) return forbidden(reply, access.error);
      let result: { entries: EntryRecord[]; limit?: number; offset?: number; total?: number };
      try {
        result = hasContentListQuery(request.query)
          ? await queryEntries(database, schema.id, contentListOptions(request.query))
          : { entries: await listEntries(database, schema.id) };
      } catch (error) {
        return sendContentError(reply, error, 400);
      }
      if (!shouldPopulateRelations(request.query.populate)) {
        return { ok: true, schema: schema.slug, ...result };
      }
      return {
        ok: true,
        schema: schema.slug,
        ...result,
        entries: await Promise.all(result.entries.map((entry) => populateContentEntry(database, request, schema, entry))),
      };
    },
  );

  server.post<{ Body: ContentBody; Params: ContentListParams }>(
    "/api/content/:schemaSlug",
    async (request, reply) => {
      const schema = await findSchema(database, request.params.schemaSlug, reply);
      if (!schema) return reply;
      const access = await canAccess(database, request, schema, "create");
      if (!access.allowed) return forbidden(reply, access.error);
      try {
        const entry = await createEntry(database, { schemaId: schema.id, data: request.body.data });
        await emitEntryMutationWebhook(database, schema, "entry.created", entry, webhookOptions);
        emitEntryRealtime(realtimeBroker, schema, "entry.created", entry);
        return { ok: true, entry };
      } catch (error) {
        return sendContentError(reply, error, 400);
      }
    },
  );

  server.get<{ Params: ContentEntryParams; Querystring: ContentPopulateQuery }>(
    "/api/content/:schemaSlug/:entryId",
    async (request, reply) => {
      const schema = await findSchema(database, request.params.schemaSlug, reply);
      if (!schema) return reply;
      const access = await canAccess(database, request, schema, "get");
      if (!access.allowed) return forbidden(reply, access.error);
      const entry = await getEntryById(database, request.params.entryId);
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
        return { ok: true, entry: await populateContentEntry(database, request, schema, selectedEntry) };
      }
      return { ok: true, entry: selectedEntry };
    },
  );

  server.put<{ Body: ContentBody; Params: ContentEntryParams }>(
    "/api/content/:schemaSlug/:entryId",
    async (request, reply) => {
      const schema = await findSchema(database, request.params.schemaSlug, reply);
      if (!schema) return reply;
      const access = await canAccess(database, request, schema, "update");
      if (!access.allowed) return forbidden(reply, access.error);
      if (!(await entryBelongsToSchema(database, request.params.entryId, schema.id))) {
        return reply.code(404).send({ ok: false, error: "ENTRY_NOT_FOUND" });
      }
      try {
        const entry = await updateEntry(database, request.params.entryId, request.body);
        await emitEntryMutationWebhook(database, schema, "entry.updated", entry, webhookOptions);
        emitEntryRealtime(realtimeBroker, schema, "entry.updated", entry);
        return { ok: true, entry };
      } catch (error) {
        return sendContentError(reply, error, 400);
      }
    },
  );

  server.delete<{ Params: ContentEntryParams }>(
    "/api/content/:schemaSlug/:entryId",
    async (request, reply) => {
      const schema = await findSchema(database, request.params.schemaSlug, reply);
      if (!schema) return reply;
      const access = await canAccess(database, request, schema, "delete");
      if (!access.allowed) return forbidden(reply, access.error);
      if (!(await entryBelongsToSchema(database, request.params.entryId, schema.id))) {
        return reply.code(404).send({ ok: false, error: "ENTRY_NOT_FOUND" });
      }
      const entry = await getEntryById(database, request.params.entryId);
      await deleteEntry(database, request.params.entryId);
      if (entry) await emitEntryMutationWebhook(database, schema, "entry.deleted", entry, webhookOptions);
      if (entry) emitEntryRealtime(realtimeBroker, schema, "entry.deleted", entry);
      return { ok: true, deleted: true };
    },
  );
}

async function findSchema(
  database: ApiagexDatabase,
  slug: string,
  reply: FastifyReply,
): Promise<SchemaRecord | undefined> {
  const schema = await getSchemaBySlug(database, slug);
  if (!schema) reply.code(404).send({ ok: false, error: "SCHEMA_NOT_FOUND" });
  return schema;
}

async function entryBelongsToSchema(
  database: ApiagexDatabase,
  entryId: string,
  schemaId: string,
): Promise<boolean> {
  const entry = await getEntryById(database, entryId);
  return Boolean(entry && entry.schemaId === schemaId);
}

async function canAccess(
  database: ApiagexDatabase,
  request: FastifyRequest,
  schema: SchemaRecord,
  action: "getAll" | "get" | "create" | "update" | "delete",
): Promise<{ allowed: boolean; error?: string }> {
  const token = requestApiToken(request);
  if (token) {
    const apiToken = await resolveApiToken(database, token);
    if (!apiToken) return { allowed: false, error: "API_TOKEN_INVALID" };
    return { allowed: await canRoleAccess(database, apiToken.roleId, schema.id, action) };
  }
  const roleId = request.headers["x-apiagex-role-id"];
  if (!roleId) return { allowed: await canPublicAccess(database, schema.id, action) };
  if (Array.isArray(roleId)) return { allowed: false };
  return { allowed: await canRoleAccess(database, roleId, schema.id, action) };
}

async function canPublicAccess(
  database: ApiagexDatabase,
  schemaId: string,
  action: "getAll" | "get" | "create" | "update" | "delete",
): Promise<boolean> {
  const publicRole = (await listRoles(database)).find((role) => role.name === "public");
  return publicRole ? canRoleAccess(database, publicRole.id, schemaId, action) : false;
}

async function populateContentEntry(
  database: ApiagexDatabase,
  request: FastifyRequest,
  schema: SchemaRecord,
  entry: EntryRecord,
): Promise<PopulatedEntryRecord> {
  return populateEntryRelations(database, schema, entry, async (targetSchema) =>
    (await canAccess(database, request, targetSchema, "get")).allowed,
  );
}

function requestApiToken(request: FastifyRequest): string | undefined {
  const directToken = headerString(request.headers["x-apiagex-api-token"]);
  if (directToken) return directToken;
  const authorization = headerString(request.headers.authorization);
  if (!authorization?.toLowerCase().startsWith("bearer ")) return undefined;
  return authorization.slice(7).trim() || "__empty_api_token__";
}

function headerString(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value.trim() : undefined;
}

function forbidden(reply: FastifyReply, error = "API_PERMISSION_DENIED"): FastifyReply {
  return reply.code(403).send({ ok: false, error });
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
