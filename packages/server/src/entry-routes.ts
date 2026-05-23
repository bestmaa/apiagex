import type { FastifyInstance, FastifyReply } from "fastify";
import {
  createEntry,
  deleteEntry,
  getEntryById,
  getSchemaById,
  listEntries,
  queryEntries,
  updateEntry,
  type ApiagexDatabase,
  type EntryListOptions,
  type SchemaRecord,
} from "@apiagex/database";
import type {
  EntryBody,
  EntryListParams,
  EntryListQuery,
  EntryParams,
} from "./entry-routes.type.js";
import { emitEntryMutationWebhook } from "./entry-webhooks.js";
import { emitEntryRealtime } from "./entry-realtime.js";
import type { RealtimeBroker } from "./realtime-broker.type.js";
import type { WebhookDispatcherOptions } from "./webhook-dispatcher.type.js";
import { uploadMedia } from "./media-routes.js";
import { currentUploadsPath } from "./request-runtime.js";

const imageContentTypes = new Set(["image/gif", "image/jpeg", "image/png", "image/webp"]);

export function registerEntryRoutes(
  server: FastifyInstance,
  database: ApiagexDatabase,
  uploadsPath: string,
  webhookOptions: WebhookDispatcherOptions = {},
  realtimeBroker?: RealtimeBroker,
): void {
  server.get<{ Params: EntryListParams; Querystring: EntryListQuery }>(
    "/api/admin/schemas/:schemaId/entries",
    async (request, reply) => {
      try {
        if (!hasEntryListQuery(request.query)) {
          return { ok: true, entries: await listEntries(database, request.params.schemaId) };
        }
        return {
          ok: true,
          ...(await queryEntries(database, request.params.schemaId, entryListOptions(request.query))),
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
        const schema = await getSchemaById(database, request.params.schemaId);
        if (!schema) return reply.code(404).send({ ok: false, error: "SCHEMA_NOT_FOUND" });
        const data = await applySchemaMediaUploads(currentUploadsPath(uploadsPath), schema, request.body);
        const entry = await createEntry(database, { schemaId: request.params.schemaId, data });
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
      const entry = await getEntryById(database, request.params.entryId);
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
        if (!(await entryBelongsToSchema(database, request.params.entryId, request.params.schemaId))) {
          return reply.code(404).send({ ok: false, error: "ENTRY_NOT_FOUND" });
        }
        const schema = await getSchemaById(database, request.params.schemaId);
        if (!schema) return reply.code(404).send({ ok: false, error: "SCHEMA_NOT_FOUND" });
        const data = await applySchemaMediaUploads(currentUploadsPath(uploadsPath), schema, request.body);
        const entry = await updateEntry(database, request.params.entryId, { data });
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
        if (!(await entryBelongsToSchema(database, request.params.entryId, request.params.schemaId))) {
          return reply.code(404).send({ ok: false, error: "ENTRY_NOT_FOUND" });
        }
        const entry = await getEntryById(database, request.params.entryId);
        const schema = await getSchemaById(database, request.params.schemaId);
        await deleteEntry(database, request.params.entryId);
        if (entry && schema) await emitEntryMutationWebhook(database, schema, "entry.deleted", entry, webhookOptions);
        if (entry && schema) emitEntryRealtime(realtimeBroker, schema, "entry.deleted", entry);
        return { ok: true, deleted: true };
      } catch (error) {
        return sendEntryError(reply, error, 404);
      }
    },
  );
}

async function applySchemaMediaUploads(
  uploadsPath: string,
  schema: SchemaRecord,
  body: EntryBody,
): Promise<EntryBody["data"]> {
  const mediaUploads = body.mediaUploads ?? {};
  const data = { ...body.data };
  for (const [fieldSlug, upload] of Object.entries(mediaUploads)) {
    const field = schema.fields.find((item) => item.slug === fieldSlug);
    if (!field || !isUploadField(field.type)) throw new Error(`ENTRY_MEDIA_FIELD_INVALID:${fieldSlug}`);
    const uploaded = await uploadMedia(uploadsPath, upload, {
      ...(field.type === "image" ? { allowedContentTypes: imageContentTypes } : {}),
      pathSegments: [schema.slug, field.slug],
    });
    data[fieldSlug] = uploaded.media.url;
  }
  return data;
}

function isUploadField(type: SchemaRecord["fields"][number]["type"]): boolean {
  return type === "media" || type === "file" || type === "image";
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

async function entryBelongsToSchema(
  database: ApiagexDatabase,
  entryId: string,
  schemaId: string,
): Promise<boolean> {
  const entry = await getEntryById(database, entryId);
  return Boolean(entry && entry.schemaId === schemaId);
}

function errorCode(error: unknown): string {
  return error instanceof Error ? error.message : "ENTRY_REQUEST_FAILED";
}
