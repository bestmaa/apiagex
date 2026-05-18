import type { FastifyInstance } from "fastify";
import type {
  ApiagexDatabase,
  ApiTokenRecord,
  CreatedApiToken,
  CreateEntryInput,
  CreateRealtimeSessionInput,
  CreateSchemaInput,
  CreateUserInput,
  EntryData,
  EntryListOptions,
  EntryListResult,
  EntryRecord,
  RoleRecord,
  SchemaRecord,
  UpdateEntryInput,
  UserRecord,
} from "@apiagex/database";

export interface ApiagexProjectTypes {}

export type ApiagexProjectSchemaMap =
  ApiagexProjectTypes extends { schemas: infer Schemas }
    ? Schemas
    : Record<string, EntryData>;

export type ApiagexSchemaSlug = Extract<keyof ApiagexProjectSchemaMap, string>;

export type ApiagexEntryDataFor<TSlug extends ApiagexSchemaSlug> =
  TSlug extends keyof ApiagexProjectSchemaMap
    ? ApiagexProjectSchemaMap[TSlug]
    : EntryData;

export type ApiagexEntryFor<TSlug extends ApiagexSchemaSlug> =
  EntryRecord & { data: ApiagexEntryDataFor<TSlug> };

export type ApiagexTypedEntryListOptions<TSlug extends ApiagexSchemaSlug> =
  Omit<EntryListOptions, "fields"> & {
    fields?: Extract<keyof ApiagexEntryDataFor<TSlug>, string>[];
  };

export type ApiagexTypedCreateEntryInput<TSlug extends ApiagexSchemaSlug> = {
  data: ApiagexEntryDataFor<TSlug>;
};

export type ApiagexTypedUpdateEntryInput<TSlug extends ApiagexSchemaSlug> = {
  data: ApiagexEntryDataFor<TSlug>;
};

export type ApiagexCustomRouteContext = {
  database: ApiagexDatabase;
  entries: {
    create(input: CreateEntryInput): Promise<EntryRecord>;
    create<TSlug extends ApiagexSchemaSlug>(
      schemaSlug: TSlug,
      input: ApiagexTypedCreateEntryInput<TSlug>,
    ): Promise<ApiagexEntryFor<TSlug>>;
    delete(entryId: string): Promise<void>;
    getById<TSlug extends ApiagexSchemaSlug>(
      schemaSlug: TSlug,
      entryId: string,
    ): Promise<ApiagexEntryFor<TSlug> | undefined>;
    getById(entryId: string): Promise<EntryRecord | undefined>;
    list<TSlug extends ApiagexSchemaSlug>(schemaSlug: TSlug): Promise<ApiagexEntryFor<TSlug>[]>;
    list(schemaId: string): Promise<EntryRecord[]>;
    query<TSlug extends ApiagexSchemaSlug>(
      schemaSlug: TSlug,
      options?: ApiagexTypedEntryListOptions<TSlug>,
    ): Promise<Omit<EntryListResult, "entries"> & { entries: ApiagexEntryFor<TSlug>[] }>;
    query(schemaId: string, options?: EntryListOptions): Promise<EntryListResult>;
    update(entryId: string, input: UpdateEntryInput): Promise<EntryRecord>;
    update<TSlug extends ApiagexSchemaSlug>(
      schemaSlug: TSlug,
      entryId: string,
      input: ApiagexTypedUpdateEntryInput<TSlug>,
    ): Promise<ApiagexEntryFor<TSlug>>;
  };
  schemas: {
    create(input: CreateSchemaInput): Promise<SchemaRecord>;
    getById(schemaId: string): Promise<SchemaRecord | undefined>;
    getBySlug<TSlug extends ApiagexSchemaSlug>(slug: TSlug): Promise<(SchemaRecord & { slug: TSlug }) | undefined>;
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
