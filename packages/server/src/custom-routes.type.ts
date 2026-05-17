import type { FastifyInstance } from "fastify";
import type {
  ApiagexDatabase,
  ApiTokenRecord,
  CreatedApiToken,
  CreateEntryInput,
  CreateRealtimeSessionInput,
  CreateSchemaInput,
  CreateUserInput,
  EntryListOptions,
  EntryListResult,
  EntryRecord,
  RoleRecord,
  SchemaRecord,
  UpdateEntryInput,
  UserRecord,
} from "@apiagex/database";

export type ApiagexCustomRouteContext = {
  database: ApiagexDatabase;
  entries: {
    create(input: CreateEntryInput): Promise<EntryRecord>;
    delete(entryId: string): Promise<void>;
    getById(entryId: string): Promise<EntryRecord | undefined>;
    list(schemaId: string): Promise<EntryRecord[]>;
    query(schemaId: string, options?: EntryListOptions): Promise<EntryListResult>;
    update(entryId: string, input: UpdateEntryInput): Promise<EntryRecord>;
  };
  schemas: {
    create(input: CreateSchemaInput): Promise<SchemaRecord>;
    getById(schemaId: string): Promise<SchemaRecord | undefined>;
    getBySlug(slug: string): Promise<SchemaRecord | undefined>;
    list(): Promise<SchemaRecord[]>;
  };
  roles: {
    canAccess(roleId: string, schemaId: string, action: "getAll" | "get" | "create" | "update" | "delete" | "realtime" | "manage"): Promise<boolean>;
    createToken(roleId: string, input: { name?: string }): Promise<CreatedApiToken>;
    list(): Promise<RoleRecord[]>;
    resolveToken(token: string): Promise<ApiTokenRecord | undefined>;
  };
  realtime: {
    createSession(input: CreateRealtimeSessionInput): Promise<{ token: string; expiresAt: string; tokenPrefix: string }>;
  };
  users: {
    create(input: CreateUserInput): Promise<UserRecord>;
  };
};

export type RegisterApiagexCustomRoutes = (
  server: FastifyInstance,
  context: ApiagexCustomRouteContext,
) => void | Promise<void>;
