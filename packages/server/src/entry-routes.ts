import type { FastifyInstance, FastifyReply } from "fastify";
import {
  createEntry,
  deleteEntry,
  getEntryById,
  listEntries,
  updateEntry,
  type SqliteDatabase,
} from "@apiagex/database";
import type { EntryBody, EntryListParams, EntryParams } from "./entry-routes.type.js";

export function registerEntryRoutes(
  server: FastifyInstance,
  database: SqliteDatabase,
): void {
  server.get<{ Params: EntryListParams }>(
    "/api/admin/schemas/:schemaId/entries",
    async (request, reply) => {
      try {
        return { ok: true, entries: listEntries(database, request.params.schemaId) };
      } catch (error) {
        return sendEntryError(reply, error, 404);
      }
    },
  );

  server.post<{ Body: EntryBody; Params: EntryListParams }>(
    "/api/admin/schemas/:schemaId/entries",
    async (request, reply) => {
      try {
        const data = request.body.data;
        return { ok: true, entry: createEntry(database, { schemaId: request.params.schemaId, data }) };
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
        return { ok: true, entry: updateEntry(database, request.params.entryId, request.body) };
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
        deleteEntry(database, request.params.entryId);
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
