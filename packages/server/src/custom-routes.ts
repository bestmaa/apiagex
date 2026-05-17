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
} from "@apiagex/database";
import type { ApiagexCustomRouteContext } from "./custom-routes.type.js";

export function createCustomRouteContext(database: ApiagexDatabase): ApiagexCustomRouteContext {
  return {
    database,
    entries: {
      create: (input) => createEntry(database, input),
      delete: (entryId) => deleteEntry(database, entryId),
      getById: (entryId) => getEntryById(database, entryId),
      list: (schemaId) => listEntries(database, schemaId),
      query: (schemaId, options = {}) => queryEntries(database, schemaId, options),
      update: (entryId, input) => updateEntry(database, entryId, input),
    },
    schemas: {
      create: (input) => createSchema(database, input),
      getById: (schemaId) => getSchemaById(database, schemaId),
      getBySlug: (slug) => getSchemaBySlug(database, slug),
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
