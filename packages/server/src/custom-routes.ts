import {
  canRoleAccess,
  createApiToken,
  createEntry,
  createRealtimeSession,
  createSchema,
  createUser,
  deleteEntry,
  getEntryById,
  getSchemaById,
  getSchemaBySlug,
  listEntries,
  listRoles,
  listSchemas,
  queryEntries,
  resolveApiToken,
  updateEntry,
  type ApiagexDatabase,
  type CreateEntryInput,
  type EntryData,
  type EntryListOptions,
  type SchemaRecord,
  type UpdateEntryInput,
} from "@apiagex/database";
import type { ApiagexCustomRouteContext } from "./custom-routes.type.js";

export function createCustomRouteContext(database: ApiagexDatabase): ApiagexCustomRouteContext {
  return {
    database,
    entries: {
      create: (async (inputOrSlug: CreateEntryInput | string, input?: { data: EntryData }) => {
        if (typeof inputOrSlug !== "string") return createEntry(database, inputOrSlug);
        const schema = await resolveSchema(database, inputOrSlug);
        return createEntry(database, { schemaId: schema.id, data: input?.data ?? {} });
      }) as ApiagexCustomRouteContext["entries"]["create"],
      delete: (entryId) => deleteEntry(database, entryId),
      getById: (async (schemaSlugOrEntryId: string, entryId?: string) => {
        if (entryId === undefined) return getEntryById(database, schemaSlugOrEntryId);
        const schema = await resolveSchema(database, schemaSlugOrEntryId);
        const entry = await getEntryById(database, entryId);
        if (entry && entry.schemaId !== schema.id) return undefined;
        return entry;
      }) as ApiagexCustomRouteContext["entries"]["getById"],
      list: (async (schemaSlugOrId: string) => {
        const schema = await resolveSchema(database, schemaSlugOrId);
        return listEntries(database, schema.id);
      }) as ApiagexCustomRouteContext["entries"]["list"],
      query: (async (schemaSlugOrId: string, options: EntryListOptions = {}) => {
        const schema = await resolveSchema(database, schemaSlugOrId);
        return queryEntries(database, schema.id, options);
      }) as ApiagexCustomRouteContext["entries"]["query"],
      update: (async (entryIdOrSlug: string, inputOrEntryId: UpdateEntryInput | string, input?: UpdateEntryInput) => {
        if (typeof inputOrEntryId !== "string") return updateEntry(database, entryIdOrSlug, inputOrEntryId);
        const schema = await resolveSchema(database, entryIdOrSlug);
        const entry = await getEntryById(database, inputOrEntryId);
        if (!entry) throw new Error("ENTRY_NOT_FOUND");
        if (entry.schemaId !== schema.id) throw new Error("ENTRY_SCHEMA_MISMATCH");
        return updateEntry(database, inputOrEntryId, input ?? { data: {} });
      }) as ApiagexCustomRouteContext["entries"]["update"],
    },
    schemas: {
      create: (input) => createSchema(database, input),
      getById: (schemaId) => getSchemaById(database, schemaId),
      getBySlug: ((slug: string) => getSchemaBySlug(database, slug)) as ApiagexCustomRouteContext["schemas"]["getBySlug"],
      list: () => listSchemas(database),
    },
    roles: {
      canAccess: (roleId, schemaId, action) => canRoleAccess(database, roleId, schemaId, action),
      createToken: (roleId, input) => createApiToken(database, { ...input, roleId }),
      list: () => listRoles(database),
      resolveToken: (token) => resolveApiToken(database, token),
    },
    realtime: {
      createSession: async (input) => {
        const created = await createRealtimeSession(database, input);
        return {
          token: created.token,
          expiresAt: created.session.expiresAt,
          tokenPrefix: created.session.tokenPrefix,
        };
      },
    },
    users: {
      create: (input) => createUser(database, input),
    },
  };
}

async function resolveSchema(database: ApiagexDatabase, slugOrId: string): Promise<SchemaRecord> {
  const schema = await getSchemaBySlug(database, slugOrId) ?? await getSchemaById(database, slugOrId);
  if (!schema) throw new Error(`SCHEMA_NOT_FOUND:${slugOrId}`);
  return schema;
}
