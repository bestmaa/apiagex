import type { FastifyInstance, FastifyReply } from "fastify";
import {
  createEntry,
  deleteEntry,
  type EntryListOptions,
  getEntryById,
  getSchemaById,
  listEntries,
  queryEntries,
  updateEntry,
  type SqliteDatabase,
} from "apiagex-database";
import type {
  EntryBody,
  EntryListParams,
  EntryListQuery,
  EntryParams,
} from "./entry-routes.type.js";
import { emitEntryMutationWebhook } from "./entry-webhooks.js";
import type { WebhookDispatcherOptions } from "./webhook-dispatcher.type.js";
import { emitEntryRealtime } from "./entry-realtime.js";
import type { RealtimeBroker } from "./realtime-broker.type.js";

export function registerEntryRoutes(
  server: FastifyInstance,
  database: SqliteDatabase,
  webhookOptions: WebhookDispatcherOptions = {},
  realtimeBroker?: RealtimeBroker,
): void {
  server.get<{ Params: EntryListParams; Querystring: EntryListQuery }>(
    "/api/admin/schemas/:schemaId/entries",
    async (request, reply) => {
      try {
        if (!hasEntryListQuery(request.query)) {
          return { ok: true, entries: listEntries(database, request.params.schemaId) };
        }
        return {
          ok: true,
          ...queryEntries(database, request.params.schemaId, entryListOptions(request.query)),
        };
      } catch (error) {
        return sendEntryError(reply, error, statusFor(error));
      }
    },
  );

  server.post<{ Body: EntryBody; Params: EntryListParams }>(
    "/api/admin/schemas/:schemaId/entries",
    async (request, reply) => {
      try {
        const data = request.body.data;
        const entry = createEntry(database, { schemaId: request.params.schemaId, data });
        const schema = getSchemaById(database, request.params.schemaId);
        if (schema) await emitEntryMutationWebhook(database, schema, "entry.created", entry, webhookOptions);
        if (schema) emitEntryRealtime(realtimeBroker, schema, "entry.created", entry);
        return { ok: true, entry };
      } catch (error) {
        return sendEntryError(reply, error, statusFor(error));
      }
    },
  );

  server.get<{ Params: EntryParams }>(
    "/api/admin/schemas/:schemaId/entries/:entryId",
    async (request, reply) => {
      const entry = getEntryById(database, request.params.entryId);
      if (!entry || entry.schemaId !== request.params.schemaId) {
        return reply.code(404).send({ ok: false, error: "ENTRY_NOT_FOUND" });
      }
      return { ok: true, entry };
    },
  );

  server.put<{ Body: EntryBody; Params: EntryParams }>(
    "/api/admin/schemas/:schemaId/entries/:entryId",
    async (request, reply) => {
      try {
        if (!entryBelongsToSchema(database, request.params.entryId, request.params.schemaId)) {
          return reply.code(404).send({ ok: false, error: "ENTRY_NOT_FOUND" });
        }
        const entry = updateEntry(database, request.params.entryId, request.body);
        const schema = getSchemaById(database, request.params.schemaId);
        if (schema) await emitEntryMutationWebhook(database, schema, "entry.updated", entry, webhookOptions);
        if (schema) emitEntryRealtime(realtimeBroker, schema, "entry.updated", entry);
        return { ok: true, entry };
      } catch (error) {
        return sendEntryError(reply, error, statusFor(error));
      }
    },
  );

  server.delete<{ Params: EntryParams }>(
    "/api/admin/schemas/:schemaId/entries/:entryId",
    async (request, reply) => {
      try {
        if (!entryBelongsToSchema(database, request.params.entryId, request.params.schemaId)) {
          return reply.code(404).send({ ok: false, error: "ENTRY_NOT_FOUND" });
        }
        const entry = getEntryById(database, request.params.entryId);
        const schema = getSchemaById(database, request.params.schemaId);
        deleteEntry(database, request.params.entryId);
        if (entry && schema) await emitEntryMutationWebhook(database, schema, "entry.deleted", entry, webhookOptions);
        if (entry && schema) emitEntryRealtime(realtimeBroker, schema, "entry.deleted", entry);
        return { ok: true, deleted: true };
      } catch (error) {
        return sendEntryError(reply, error, 404);
      }
    },
  );
}

function sendEntryError(reply: FastifyReply, error: unknown, statusCode: number): FastifyReply {
  return reply.code(statusCode).send({ ok: false, error: errorCode(error) });
}

function hasEntryListQuery(query: EntryListQuery): boolean {
  return Boolean(query.fields || query.limit || query.offset || query.search);
}

function parseFields(value: string | undefined): string[] | undefined {
  return value?.split(",").map((field) => field.trim()).filter(Boolean);
}

function entryListOptions(query: EntryListQuery): EntryListOptions {
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

function parsePositiveNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function statusFor(error: unknown): number {
  return errorCode(error).endsWith("_NOT_FOUND") ? 404 : 400;
}

function entryBelongsToSchema(
  database: SqliteDatabase,
  entryId: string,
  schemaId: string,
): boolean {
  const entry = getEntryById(database, entryId);
  return Boolean(entry && entry.schemaId === schemaId);
}

function errorCode(error: unknown): string {
  return error instanceof Error ? error.message : "ENTRY_REQUEST_FAILED";
}
