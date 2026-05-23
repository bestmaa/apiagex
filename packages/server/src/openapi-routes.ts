import type { FastifyInstance, FastifyReply } from "fastify";
import {
  listCustomApiRoutes,
  listSchemas,
  listWorkflows,
  workflowCustomApiRouteInput,
  type ApiagexDatabase,
  type CustomApiRouteRecord,
  type FieldRecord,
  type SchemaRecord,
  type WorkflowRecord,
} from "@apiagex/database";
import { getApiDocsSettings } from "./api-docs-settings.js";

type OpenApiSchema = Record<string, unknown>;
type OpenApiDocument = {
  openapi: string;
  info: { title: string; version: string; description: string };
  servers: Array<{ url: string }>;
  tags: Array<{ name: string; description?: string }>;
  paths: Record<string, OpenApiSchema>;
  components: {
    securitySchemes: Record<string, OpenApiSchema>;
    schemas: Record<string, OpenApiSchema>;
  };
};

const queryParameters = {
  fields: {
    description: "Comma-separated field slugs to include in the response.",
    in: "query",
    name: "fields",
    schema: { type: "string", example: "title,views" },
  },
  limit: {
    description: "Maximum number of entries to return.",
    in: "query",
    name: "limit",
    schema: { type: "integer", minimum: 1, example: 50 },
  },
  offset: {
    description: "Number of entries to skip.",
    in: "query",
    name: "offset",
    schema: { type: "integer", minimum: 0, example: 0 },
  },
  populate: {
    description: "Use relations, all, or * to populate one level of relation fields.",
    in: "query",
    name: "populate",
    schema: { type: "string", enum: ["relations", "all", "*"] },
  },
  search: {
    description: "Search string fields in this collection.",
    in: "query",
    name: "search",
    schema: { type: "string", example: "keyword" },
  },
};

export function registerOpenApiRoutes(server: FastifyInstance, database: ApiagexDatabase): void {
  server.get("/api/openapi.json", async (_request, reply) => {
    if (!(await anyApiDocsEnabled(database))) return sendApiDocsDisabled(reply);
    return reply.type("application/json").send(await buildOpenApiDocument(database));
  });

  server.get("/api/swagger", async (_request, reply) => {
    if (!(await anyApiDocsEnabled(database))) return sendApiDocsDisabled(reply);
    return sendSwaggerUi(reply);
  });
  server.get("/api/docs", async (_request, reply) => {
    if (!(await anyApiDocsEnabled(database))) return sendApiDocsDisabled(reply);
    return sendSwaggerUi(reply);
  });
  server.get("/swagger", async (_request, reply) => {
    if (!(await anyApiDocsEnabled(database))) return sendApiDocsDisabled(reply);
    return sendSwaggerUi(reply);
  });
}

export async function buildOpenApiDocument(database: ApiagexDatabase): Promise<OpenApiDocument> {
  const schemas = await listSchemas(database);
  const customApiRoutes = await listCustomApiRoutes(database);
  const workflows = await listWorkflows(database);
  const components = contentSchemaComponents(schemas);
  const settings = await getApiDocsSettings(database);
  return {
    openapi: "3.0.3",
    info: {
      title: "Apiagex Generated Content API",
      version: process.env.npm_package_version ?? "0.0.0",
      description: "Dynamic OpenAPI contract generated from current Apiagex schemas.",
    },
    servers: [{ url: "/" }],
    tags: [
      ...(settings.contentEnabled
        ? [{ name: "Content", description: "Generated content APIs. Requests need API permissions unless the public role allows the action." }]
        : []),
      ...(settings.contentEnabled
        ? [{ name: "Custom APIs", description: "Project custom APIs discovered from code and mounted under /api/custom." }]
        : []),
      ...(settings.contentEnabled
        ? [{ name: "Workflow APIs", description: "No-code workflow APIs mounted under /api/custom." }]
        : []),
      ...(settings.adminEnabled
        ? [
            { name: "Admin Auth", description: "Owner setup, login, and session checks for the control plane." },
            { name: "Admin Schemas", description: "Control-plane schema builder APIs." },
            { name: "Admin Entries", description: "Control-plane content entry management APIs." },
            { name: "Admin Media", description: "Central media upload APIs." },
            { name: "Admin Roles", description: "Control-plane roles, content roles, permissions, and tokens." },
            { name: "Admin Users", description: "Content API users and control admin users." },
            { name: "Admin Settings", description: "Control-plane settings including Swagger/OpenAPI visibility." },
            { name: "Admin Webhooks", description: "Signed content change hook configuration and delivery logs." },
            { name: "Admin Realtime", description: "Realtime WebSocket configuration and session-token APIs." },
          ]
        : []),
      { name: "System", description: "Service health and OpenAPI endpoints." },
    ],
    paths: mergeOpenApiPaths(
      {
        "/api": {
          get: {
            tags: ["System"],
            summary: "API root",
            responses: okResponse({ type: "object" }),
          },
        },
        "/api/health": {
          get: {
            tags: ["System"],
            summary: "Health check",
            responses: okResponse({ type: "object" }),
          },
        },
      },
      ...(settings.adminEnabled ? [adminPaths()] : []),
      ...(settings.contentEnabled ? [Object.fromEntries(schemas.flatMap((schema) => contentPaths(schema)))] : []),
      ...(settings.contentEnabled ? [customApiPaths(customApiRoutes)] : []),
      ...(settings.contentEnabled ? [workflowApiPaths(workflows)] : []),
    ),
    components: {
      securitySchemes: {
        bearerAuth: {
          bearerFormat: "API_TOKEN",
          scheme: "bearer",
          type: "http",
        },
        apiTokenHeader: {
          in: "header",
          name: "x-apiagex-api-token",
          type: "apiKey",
        },
        adminBearerAuth: {
          bearerFormat: "ADMIN_SESSION_TOKEN",
          description: "Owner/control-plane session token returned by /api/auth/login or /api/auth/bootstrap-owner.",
          scheme: "bearer",
          type: "http",
        },
        roleIdHeader: {
          description: "Development/testing header for API role id. API tokens are preferred for real clients.",
          in: "header",
          name: "x-apiagex-role-id",
          type: "apiKey",
        },
      },
      schemas: components,
    },
  };
}

function mergeOpenApiPaths(...pathMaps: Array<Record<string, OpenApiSchema>>): Record<string, OpenApiSchema> {
  const merged: Record<string, OpenApiSchema> = {};
  for (const pathMap of pathMaps) {
    for (const [path, operations] of Object.entries(pathMap)) {
      merged[path] = {
        ...(merged[path] ?? {}),
        ...operations,
      };
    }
  }
  return merged;
}

function customApiPaths(routes: CustomApiRouteRecord[]): Record<string, OpenApiSchema> {
  const paths: Record<string, OpenApiSchema> = {};
  for (const route of routes.filter((item) => item.active && !item.permissionKey.startsWith("workflow."))) {
    const method = route.method.toLowerCase();
    if (!["delete", "get", "head", "patch", "post", "put"].includes(method)) continue;
    const path = openApiPath(route.path);
    const operation: OpenApiSchema = {
      tags: ["Custom APIs", route.groupName],
      summary: route.name,
      description: [
        `Discovered custom route: ${route.method} ${route.path}.`,
        `Permission key: ${route.permissionKey}.`,
        "Requires this custom API permission for an API role, or public permission for no-token access.",
      ].join(" "),
      security: apiTokenSecurity(),
      responses: okResponse({ type: "object", additionalProperties: true }),
    };
    const parameters = pathParametersFromRoute(path);
    if (parameters.length > 0) operation.parameters = parameters;
    paths[path] = {
      ...(paths[path] ?? {}),
      [method]: operation,
    };
  }
  return paths;
}

function workflowApiPaths(workflows: WorkflowRecord[]): Record<string, OpenApiSchema> {
  const paths: Record<string, OpenApiSchema> = {};
  for (const workflow of workflows.filter((item) => item.active)) {
    const route = workflowCustomApiRouteInput(workflow);
    const method = route.method.toLowerCase();
    if (!["delete", "get", "head", "patch", "post", "put"].includes(method)) continue;
    const path = openApiPath(route.path);
    const operation: OpenApiSchema = {
      tags: ["Workflow APIs", "Workflows"],
      summary: workflow.name,
      description: [
        `Workflow route: ${route.method} ${route.path}.`,
        `Permission key: ${route.permissionKey}.`,
        "Requires this custom API permission for an API role, or public permission for no-token access.",
      ].join(" "),
      security: apiTokenSecurity(),
      responses: okResponse({
        additionalProperties: true,
        description: "Response body returned by the workflow return node.",
        type: "object",
      }),
      "x-apiagex-workflow-id": workflow.id,
      "x-apiagex-workflow-version": workflow.version,
    };
    const parameters = pathParametersFromRoute(path);
    if (parameters.length > 0) operation.parameters = parameters;
    if (["patch", "post", "put"].includes(method)) {
      operation.requestBody = {
        required: false,
        content: {
          "application/json": {
            schema: {
              additionalProperties: true,
              description: "JSON body available to workflow nodes as request.body.",
              type: "object",
            },
          },
        },
      };
    }
    paths[path] = {
      ...(paths[path] ?? {}),
      [method]: operation,
    };
  }
  return paths;
}

function contentPaths(schema: SchemaRecord): Array<[string, OpenApiSchema]> {
  const names = componentNames(schema);
  const collectionPath = `/api/content/${schema.slug}`;
  const entryPath = `/api/content/${schema.slug}/{entryId}`;
  return [
    [
      collectionPath,
      {
        get: {
          tags: ["Content", schema.name],
          summary: `List ${schema.name} entries`,
          description: "Requires getAll permission, or public getAll permission for no-token access.",
          security: apiSecurity(),
          parameters: [queryParameters.fields, queryParameters.search, queryParameters.limit, queryParameters.offset, queryParameters.populate],
          responses: okResponse({ $ref: `#/components/schemas/${names.listResponse}` }),
        },
        post: {
          tags: ["Content", schema.name],
          summary: `Create ${schema.name} entry`,
          description: "Requires create permission, or public create permission for no-token access.",
          security: apiSecurity(),
          requestBody: requestBody(names.mutationRequest),
          responses: okResponse({ $ref: `#/components/schemas/${names.entryResponse}` }),
        },
      },
    ],
    [
      entryPath,
      {
        parameters: [
          {
            description: "Entry id returned by Apiagex.",
            in: "path",
            name: "entryId",
            required: true,
            schema: { type: "string" },
          },
        ],
        get: {
          tags: ["Content", schema.name],
          summary: `Read one ${schema.name} entry`,
          description: "Requires get permission, or public get permission for no-token access.",
          security: apiSecurity(),
          parameters: [queryParameters.fields, queryParameters.populate],
          responses: okResponse({ $ref: `#/components/schemas/${names.entryResponse}` }),
        },
        put: {
          tags: ["Content", schema.name],
          summary: `Update one ${schema.name} entry`,
          description: "Requires update permission, or public update permission for no-token access.",
          security: apiSecurity(),
          requestBody: requestBody(names.mutationRequest),
          responses: okResponse({ $ref: `#/components/schemas/${names.entryResponse}` }),
        },
        delete: {
          tags: ["Content", schema.name],
          summary: `Delete one ${schema.name} entry`,
          description: "Requires delete permission, or public delete permission for no-token access.",
          security: apiSecurity(),
          responses: okResponse({ $ref: "#/components/schemas/DeleteResponse" }),
        },
      },
    ],
  ];
}

function openApiPath(path: string): string {
  return path.replace(/:([A-Za-z0-9_]+)/g, "{$1}");
}

function pathParametersFromRoute(path: string): OpenApiSchema[] {
  const names = [...path.matchAll(/\{([^}]+)\}/g)].flatMap((match) => match[1] ? [match[1]] : []);
  return [...new Set(names)].map((name) => pathParameter(name, "Custom route path parameter."));
}

function adminPaths(): Record<string, OpenApiSchema> {
  return {
    "/api/auth/owner-status": {
      get: {
        tags: ["Admin Auth"],
        summary: "Check whether the first owner exists",
        responses: okResponse({ $ref: "#/components/schemas/OwnerStatusResponse" }),
      },
    },
    "/api/auth/bootstrap-owner": {
      post: {
        tags: ["Admin Auth"],
        summary: "Create the first owner account",
        requestBody: requestBody("AuthRequest"),
        responses: okResponse({ $ref: "#/components/schemas/AuthResponse" }),
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Admin Auth"],
        summary: "Log in to the control plane",
        requestBody: requestBody("AuthRequest"),
        responses: okResponse({ $ref: "#/components/schemas/AuthResponse" }),
      },
    },
    "/api/auth/session": {
      get: {
        tags: ["Admin Auth"],
        summary: "Validate a control-plane session token",
        security: adminSecurity(),
        responses: okResponse({ $ref: "#/components/schemas/AuthResponse" }),
      },
    },
    "/api/admin/schemas": {
      get: {
        tags: ["Admin Schemas"],
        summary: "List admin schemas",
        security: adminSecurity(),
        responses: okResponse({ $ref: "#/components/schemas/AdminSchemaListResponse" }),
      },
      post: {
        tags: ["Admin Schemas"],
        summary: "Create an admin schema",
        security: adminSecurity(),
        requestBody: requestBody("AdminSchemaDraft"),
        responses: okResponse({ $ref: "#/components/schemas/AdminSchemaMutationResponse" }),
      },
    },
    "/api/admin/schemas/{schemaId}": {
      parameters: [pathParameter("schemaId", "Schema id.")],
      get: {
        tags: ["Admin Schemas"],
        summary: "Read one admin schema",
        security: adminSecurity(),
        responses: okResponse({ $ref: "#/components/schemas/AdminSchemaMutationResponse" }),
      },
      put: {
        tags: ["Admin Schemas"],
        summary: "Update one admin schema",
        security: adminSecurity(),
        requestBody: requestBody("AdminSchemaDraft"),
        responses: okResponse({ $ref: "#/components/schemas/AdminSchemaMutationResponse" }),
      },
      delete: {
        tags: ["Admin Schemas"],
        summary: "Delete one admin schema",
        security: adminSecurity(),
        responses: okResponse({ $ref: "#/components/schemas/DeleteResponse" }),
      },
    },
    "/api/admin/schemas/{schemaId}/entries": {
      parameters: [pathParameter("schemaId", "Schema id.")],
      get: {
        tags: ["Admin Entries"],
        summary: "List admin entries for one schema",
        security: adminSecurity(),
        parameters: [queryParameters.fields, queryParameters.search, queryParameters.limit, queryParameters.offset],
        responses: okResponse({ $ref: "#/components/schemas/AdminEntryListResponse" }),
      },
      post: {
        tags: ["Admin Entries"],
        summary: "Create an admin entry",
        security: adminSecurity(),
        requestBody: requestBody("AdminEntryMutationRequest"),
        responses: okResponse({ $ref: "#/components/schemas/AdminEntryMutationResponse" }),
      },
    },
    "/api/admin/schemas/{schemaId}/entries/{entryId}": {
      parameters: [pathParameter("schemaId", "Schema id."), pathParameter("entryId", "Entry id.")],
      get: {
        tags: ["Admin Entries"],
        summary: "Read one admin entry",
        security: adminSecurity(),
        responses: okResponse({ $ref: "#/components/schemas/AdminEntryMutationResponse" }),
      },
      put: {
        tags: ["Admin Entries"],
        summary: "Update one admin entry",
        security: adminSecurity(),
        requestBody: requestBody("AdminEntryMutationRequest"),
        responses: okResponse({ $ref: "#/components/schemas/AdminEntryMutationResponse" }),
      },
      delete: {
        tags: ["Admin Entries"],
        summary: "Delete one admin entry",
        security: adminSecurity(),
        responses: okResponse({ $ref: "#/components/schemas/DeleteResponse" }),
      },
    },
    "/api/admin/media": {
      post: {
        tags: ["Admin Media"],
        summary: "Upload one media file",
        description: "Uploads a base64 file into the central uploads folder and returns a public /uploads URL.",
        security: adminSecurity(),
        requestBody: requestBody("MediaUploadRequest"),
        responses: okResponse({ $ref: "#/components/schemas/MediaUploadResponse" }),
      },
    },
    "/api/admin/roles": adminCollectionPath("Admin Roles", "content API role", "RoleDraft", "RoleListResponse", "RoleMutationResponse"),
    "/api/admin/roles/{roleId}/permissions": {
      parameters: [pathParameter("roleId", "Content API role id.")],
      get: {
        tags: ["Admin Roles"],
        summary: "List content role permissions",
        security: adminSecurity(),
        responses: okResponse({ $ref: "#/components/schemas/PermissionListResponse" }),
      },
      put: {
        tags: ["Admin Roles"],
        summary: "Save content role permissions",
        security: adminSecurity(),
        requestBody: requestBody("PermissionSaveRequest"),
        responses: okResponse({ $ref: "#/components/schemas/PermissionListResponse" }),
      },
    },
    "/api/admin/custom-api-routes": {
      get: {
        tags: ["Admin Roles"],
        summary: "List discovered custom APIs",
        description: "Custom routes written in project code are mounted under /api/custom and listed here for permission setup.",
        security: adminSecurity(),
        responses: okResponse({ type: "object" }),
      },
    },
    "/api/admin/custom-api-routes/{routeId}": {
      parameters: [pathParameter("routeId", "Custom API route id.")],
      put: {
        tags: ["Admin Roles"],
        summary: "Rename a discovered custom API label and group",
        security: adminSecurity(),
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  groupName: { type: "string" },
                  name: { type: "string" },
                },
                required: ["groupName", "name"],
              },
            },
          },
        },
        responses: okResponse({ type: "object" }),
      },
      delete: {
        tags: ["Admin Roles"],
        summary: "Delete an inactive custom API route from permissions",
        description: "Only routes not seen on the last server start can be deleted.",
        security: adminSecurity(),
        responses: okResponse({ type: "object" }),
      },
    },
    "/api/admin/custom-api-routes/{routeId}/history": {
      parameters: [pathParameter("routeId", "Custom API route id.")],
      get: {
        tags: ["Admin Roles"],
        summary: "List custom API permission audit history",
        security: adminSecurity(),
        responses: okResponse({ type: "object" }),
      },
    },
    "/api/admin/roles/{roleId}/custom-api-permissions": {
      parameters: [pathParameter("roleId", "Content API role id.")],
      get: {
        tags: ["Admin Roles"],
        summary: "List custom API role permissions",
        security: adminSecurity(),
        responses: okResponse({ type: "object" }),
      },
      put: {
        tags: ["Admin Roles"],
        summary: "Save custom API role permissions",
        security: adminSecurity(),
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  permissions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        customApiRouteId: { type: "string" },
                        allowed: { type: "boolean" },
                      },
                      required: ["customApiRouteId", "allowed"],
                    },
                  },
                },
                required: ["permissions"],
              },
            },
          },
        },
        responses: okResponse({ type: "object" }),
      },
    },
    "/api/admin/roles/{roleId}/tokens": {
      parameters: [pathParameter("roleId", "Content API role id.")],
      get: {
        tags: ["Admin Roles"],
        summary: "List content API tokens",
        security: adminSecurity(),
        responses: okResponse({ type: "object" }),
      },
      post: {
        tags: ["Admin Roles"],
        summary: "Create a content API token",
        security: adminSecurity(),
        requestBody: requestBody("TokenCreateRequest"),
        responses: okResponse({ type: "object" }),
      },
    },
    "/api/admin/roles/{roleId}/tokens/{tokenId}": {
      parameters: [pathParameter("roleId", "Content API role id."), pathParameter("tokenId", "API token id.")],
      delete: {
        tags: ["Admin Roles"],
        summary: "Revoke a content API token",
        security: adminSecurity(),
        responses: okResponse({ type: "object" }),
      },
    },
    "/api/admin/users": adminCollectionPath("Admin Users", "content API user", "UserCreateRequest", "UserListResponse", "UserMutationResponse"),
    "/api/admin/control-users": adminCollectionPath("Admin Users", "control admin user", "UserCreateRequest", "UserListResponse", "UserMutationResponse"),
    "/api/admin/settings/access": {
      get: {
        tags: ["Admin Settings"],
        summary: "List separated admin and content roles",
        security: adminSecurity(),
        responses: okResponse({ $ref: "#/components/schemas/AccessSettingsResponse" }),
      },
    },
    "/api/admin/settings/api-docs": {
      get: {
        tags: ["Admin Settings"],
        summary: "Read Swagger/OpenAPI visibility setting",
        security: adminSecurity(),
        responses: okResponse({ $ref: "#/components/schemas/ApiDocsSettingsResponse" }),
      },
      put: {
        tags: ["Admin Settings"],
        summary: "Enable or disable Swagger/OpenAPI visibility",
        security: adminSecurity(),
        requestBody: requestBody("ApiDocsSettingsRequest"),
        responses: okResponse({ $ref: "#/components/schemas/ApiDocsSettingsResponse" }),
      },
    },
    "/api/admin/settings/access/admin-roles": {
      post: {
        tags: ["Admin Settings"],
        summary: "Create a control admin role",
        security: adminSecurity(),
        requestBody: requestBody("RoleDraft"),
        responses: okResponse({ $ref: "#/components/schemas/RoleMutationResponse" }),
      },
    },
    "/api/admin/settings/access/admin-roles/{roleId}/permissions": {
      parameters: [pathParameter("roleId", "Control admin role id.")],
      get: {
        tags: ["Admin Settings"],
        summary: "List control admin role permissions",
        security: adminSecurity(),
        responses: okResponse({ $ref: "#/components/schemas/AdminPermissionListResponse" }),
      },
      put: {
        tags: ["Admin Settings"],
        summary: "Save control admin role permissions",
        security: adminSecurity(),
        requestBody: requestBody("AdminPermissionSaveRequest"),
        responses: okResponse({ $ref: "#/components/schemas/AdminPermissionListResponse" }),
      },
    },
    "/api/admin/webhooks": adminCollectionPath("Admin Webhooks", "webhook", "WebhookDraft", "WebhookListResponse", "WebhookMutationResponse"),
    "/api/admin/webhooks/{webhookId}": {
      parameters: [pathParameter("webhookId", "Webhook id.")],
      put: {
        tags: ["Admin Webhooks"],
        summary: "Update one webhook",
        security: adminSecurity(),
        requestBody: requestBody("WebhookDraft"),
        responses: okResponse({ $ref: "#/components/schemas/WebhookMutationResponse" }),
      },
      delete: {
        tags: ["Admin Webhooks"],
        summary: "Delete one webhook",
        security: adminSecurity(),
        responses: okResponse({ $ref: "#/components/schemas/DeleteResponse" }),
      },
    },
    "/api/admin/webhooks/{webhookId}/deliveries": {
      parameters: [pathParameter("webhookId", "Webhook id.")],
      get: {
        tags: ["Admin Webhooks"],
        summary: "List webhook delivery history",
        security: adminSecurity(),
        responses: okResponse({ type: "object" }),
      },
    },
    "/api/admin/realtime": {
      get: {
        tags: ["Admin Realtime"],
        summary: "List realtime configuration, connections, and event history",
        security: adminSecurity(),
        responses: okResponse({ type: "object" }),
      },
    },
    "/api/admin/realtime/{schemaId}": {
      parameters: [pathParameter("schemaId", "Schema id.")],
      put: {
        tags: ["Admin Realtime"],
        summary: "Enable or disable realtime events for one schema",
        security: adminSecurity(),
        requestBody: requestBody("RealtimeConfigRequest"),
        responses: okResponse({ type: "object" }),
      },
    },
    "/api/realtime/session": {
      post: {
        tags: ["Admin Realtime"],
        summary: "Create a one-time browser WebSocket session token",
        description: "Requires a content API token with realtime permission for the schema. getAll is accepted for backward compatibility.",
        security: apiTokenSecurity(),
        requestBody: requestBody("RealtimeSessionRequest"),
        responses: okResponse({ type: "object" }),
      },
    },
  };
}

function contentSchemaComponents(schemas: SchemaRecord[]): Record<string, OpenApiSchema> {
  const components: Record<string, OpenApiSchema> = {
    DeleteResponse: {
      type: "object",
      properties: {
        ok: { type: "boolean", example: true },
        deleted: { type: "boolean", example: true },
      },
      required: ["ok", "deleted"],
    },
    ErrorResponse: {
      type: "object",
      properties: {
        ok: { type: "boolean", example: false },
        error: { type: "string", example: "API_PERMISSION_DENIED" },
      },
      required: ["ok", "error"],
    },
    ...adminSchemaComponents(),
  };
  for (const schema of schemas) {
    const names = componentNames(schema);
    const dataSchema = entryDataSchema(schema.fields);
    components[names.data] = dataSchema;
    components[names.mutationRequest] = {
      type: "object",
      properties: { data: { $ref: `#/components/schemas/${names.data}` } },
      required: ["data"],
    };
    components[names.entry] = {
      type: "object",
      properties: {
        id: { type: "string" },
        schemaId: { type: "string", example: schema.id },
        data: { $ref: `#/components/schemas/${names.data}` },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" },
      },
      required: ["id", "schemaId", "data", "createdAt", "updatedAt"],
    };
    components[names.entryResponse] = {
      type: "object",
      properties: {
        ok: { type: "boolean", example: true },
        entry: { $ref: `#/components/schemas/${names.entry}` },
      },
      required: ["ok", "entry"],
    };
    components[names.listResponse] = {
      type: "object",
      properties: {
        ok: { type: "boolean", example: true },
        schema: { type: "string", example: schema.slug },
        entries: {
          type: "array",
          items: { $ref: `#/components/schemas/${names.entry}` },
        },
        total: { type: "integer" },
        limit: { type: "integer" },
        offset: { type: "integer" },
      },
      required: ["ok", "schema", "entries", "total", "limit", "offset"],
    };
  }
  return components;
}

function adminSchemaComponents(): Record<string, OpenApiSchema> {
  return {
    AuthRequest: {
      type: "object",
      properties: {
        email: { type: "string", format: "email", example: "owner@example.com" },
        password: { type: "string", format: "password", minLength: 8 },
      },
      required: ["email", "password"],
    },
    AuthResponse: {
      type: "object",
      properties: {
        ok: { type: "boolean", example: true },
        token: { type: "string" },
        user: { type: "object" },
      },
      required: ["ok"],
    },
    OwnerStatusResponse: {
      type: "object",
      properties: {
        ok: { type: "boolean", example: true },
        hasOwner: { type: "boolean" },
      },
      required: ["ok", "hasOwner"],
    },
    AdminFieldDraft: {
      type: "object",
      properties: {
        name: { type: "string", example: "Title" },
        slug: { type: "string", example: "title" },
        type: {
          type: "string",
          enum: [
            "text",
            "longText",
            "number",
            "boolean",
            "date",
            "datetime",
            "time",
            "email",
            "url",
            "integer",
            "decimal",
            "currency",
            "enum",
            "multiSelect",
            "password",
            "richText",
            "json",
            "media",
            "file",
            "image",
            "relation",
          ],
        },
        options: { type: "array", items: { type: "string" }, description: "Allowed values for enum and multiSelect fields." },
        required: { type: "boolean", example: false },
        relationSchemaId: { type: "string", nullable: true },
        relationType: { type: "string", enum: ["oneToOne", "oneToMany", "manyToOne", "manyToMany"], nullable: true },
      },
      required: ["name", "slug", "type"],
    },
    AdminSchemaDraft: {
      type: "object",
      properties: {
        name: { type: "string", example: "Article" },
        slug: { type: "string", example: "article" },
        description: { type: "string" },
        fields: {
          type: "array",
          items: { $ref: "#/components/schemas/AdminFieldDraft" },
        },
      },
      required: ["name", "slug", "fields"],
    },
    AdminSchemaListResponse: {
      type: "object",
      properties: {
        ok: { type: "boolean", example: true },
        schemas: { type: "array", items: { type: "object" } },
      },
      required: ["ok", "schemas"],
    },
    AdminSchemaMutationResponse: {
      type: "object",
      properties: {
        ok: { type: "boolean", example: true },
        schema: { type: "object" },
      },
      required: ["ok", "schema"],
    },
    AdminEntryMutationRequest: {
      type: "object",
      properties: {
        data: { type: "object", additionalProperties: true },
        mediaUploads: {
          type: "object",
          additionalProperties: { $ref: "#/components/schemas/MediaUploadRequest" },
          description: "Optional schema-scoped media uploads keyed by media field slug. Uploaded URLs are saved into data automatically.",
        },
      },
      required: ["data"],
    },
    AdminEntryListResponse: {
      type: "object",
      properties: {
        ok: { type: "boolean", example: true },
        entries: { type: "array", items: { type: "object" } },
        total: { type: "integer" },
        limit: { type: "integer" },
        offset: { type: "integer" },
      },
      required: ["ok", "entries"],
    },
    AdminEntryMutationResponse: {
      type: "object",
      properties: {
        ok: { type: "boolean", example: true },
        entry: { type: "object" },
      },
      required: ["ok", "entry"],
    },
    MediaUploadRequest: {
      type: "object",
      properties: {
        contentBase64: { type: "string", description: "Base64 file bytes. Data URLs are also accepted." },
        contentType: { type: "string", enum: ["application/pdf", "image/gif", "image/jpeg", "image/png", "image/webp"] },
        filename: { type: "string", example: "hero.png" },
      },
      required: ["contentBase64", "contentType", "filename"],
    },
    MediaUploadResponse: {
      type: "object",
      properties: {
        ok: { type: "boolean", example: true },
        media: {
          type: "object",
          properties: {
            contentType: { type: "string" },
            filename: { type: "string" },
            id: { type: "string" },
            size: { type: "integer" },
            url: { type: "string", example: "/uploads/asset.png" },
          },
          required: ["contentType", "filename", "id", "size", "url"],
        },
      },
      required: ["ok", "media"],
    },
    RoleDraft: {
      type: "object",
      properties: {
        name: { type: "string", example: "reader" },
        description: { type: "string" },
      },
      required: ["name"],
    },
    RoleListResponse: {
      type: "object",
      properties: {
        ok: { type: "boolean", example: true },
        roles: { type: "array", items: { type: "object" } },
      },
      required: ["ok", "roles"],
    },
    RoleMutationResponse: {
      type: "object",
      properties: {
        ok: { type: "boolean", example: true },
        role: { type: "object" },
      },
      required: ["ok", "role"],
    },
    PermissionSaveRequest: permissionSaveSchema(["getAll", "get", "create", "update", "delete", "realtime", "manage"]),
    AdminPermissionSaveRequest: permissionSaveSchema(["schemas", "entries", "apiRoles", "apiUsers", "settings"]),
    PermissionListResponse: permissionListSchema(),
    AdminPermissionListResponse: permissionListSchema(),
    TokenCreateRequest: {
      type: "object",
      properties: { name: { type: "string", example: "Kitchen app" } },
      required: ["name"],
    },
    UserCreateRequest: {
      type: "object",
      properties: {
        email: { type: "string", format: "email" },
        password: { type: "string", format: "password", minLength: 8 },
        roleId: { type: "string" },
      },
      required: ["email", "password", "roleId"],
    },
    UserListResponse: {
      type: "object",
      properties: {
        ok: { type: "boolean", example: true },
        roles: { type: "array", items: { type: "object" } },
        users: { type: "array", items: { type: "object" } },
      },
      required: ["ok", "roles", "users"],
    },
    UserMutationResponse: {
      type: "object",
      properties: {
        ok: { type: "boolean", example: true },
        user: { type: "object" },
      },
      required: ["ok", "user"],
    },
    AccessSettingsResponse: {
      type: "object",
      properties: {
        ok: { type: "boolean", example: true },
        adminRoles: { type: "array", items: { type: "object" } },
        apiRoles: { type: "array", items: { type: "object" } },
      },
      required: ["ok", "adminRoles", "apiRoles"],
    },
    ApiDocsSettingsRequest: {
      type: "object",
      properties: {
        adminEnabled: { type: "boolean", example: false },
        contentEnabled: { type: "boolean", example: true },
      },
      required: ["adminEnabled", "contentEnabled"],
    },
    ApiDocsSettingsResponse: {
      type: "object",
      properties: {
        ok: { type: "boolean", example: true },
        settings: {
          type: "object",
          properties: {
            adminEnabled: { type: "boolean" },
            contentEnabled: { type: "boolean" },
            updatedAt: { type: "string", format: "date-time", nullable: true },
          },
          required: ["adminEnabled", "contentEnabled", "updatedAt"],
        },
      },
      required: ["ok", "settings"],
    },
    WebhookDraft: {
      type: "object",
      properties: {
        name: { type: "string" },
        url: { type: "string", format: "uri" },
        secret: { type: "string", description: "Generated when empty." },
        events: { type: "array", items: { type: "string", enum: ["entry.created", "entry.updated", "entry.deleted"] } },
        schemaId: { type: "string", nullable: true },
        active: { type: "boolean" },
      },
      required: ["name", "url", "events", "active"],
    },
    WebhookListResponse: {
      type: "object",
      properties: {
        ok: { type: "boolean", example: true },
        webhooks: { type: "array", items: { type: "object" } },
      },
      required: ["ok", "webhooks"],
    },
    WebhookMutationResponse: {
      type: "object",
      properties: {
        ok: { type: "boolean", example: true },
        webhook: { type: "object" },
      },
      required: ["ok", "webhook"],
    },
    RealtimeConfigRequest: {
      type: "object",
      properties: {
        enabled: { type: "boolean" },
        events: { type: "array", items: { type: "string", enum: ["entry.created", "entry.updated", "entry.deleted"] } },
      },
      required: ["enabled", "events"],
    },
    RealtimeSessionRequest: {
      type: "object",
      properties: {
        schema: { type: "string", example: "orders" },
        ttlSeconds: { type: "integer", minimum: 30, maximum: 300 },
      },
      required: ["schema"],
    },
  };
}

function entryDataSchema(fields: FieldRecord[]): OpenApiSchema {
  return {
    type: "object",
    properties: Object.fromEntries(fields.map((field) => [field.slug, fieldSchema(field)])),
    required: fields.filter((field) => field.required).map((field) => field.slug),
    additionalProperties: false,
  };
}

function fieldSchema(field: FieldRecord): OpenApiSchema {
  const description = `${field.name}${field.required ? " (required)" : ""}`;
  if (field.type === "number") return { type: "number", description };
  if (field.type === "integer") return { type: "integer", description };
  if (field.type === "decimal" || field.type === "currency") return { type: "number", description };
  if (field.type === "boolean") return { type: "boolean", description };
  if (field.type === "date") return { type: "string", format: "date", description };
  if (field.type === "datetime") return { type: "string", format: "date-time", description };
  if (field.type === "time") return { type: "string", pattern: "^([01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d)?$", description };
  if (field.type === "email") return { type: "string", format: "email", description };
  if (field.type === "url") return { type: "string", format: "uri", description };
  if (field.type === "password") return { type: "string", format: "password", description };
  if (field.type === "enum") return { type: "string", enum: field.options, description };
  if (field.type === "multiSelect") return { type: "array", items: { type: "string", enum: field.options }, description };
  if (field.type === "json") return { description, nullable: !field.required };
  if (field.type === "media" || field.type === "file" || field.type === "image") {
    return { type: "string", description, example: "/uploads/example.png" };
  }
  if (field.type === "relation") {
    const multi = field.relationType === "oneToMany" || field.relationType === "manyToMany";
    return multi
      ? { type: "array", items: { type: "string" }, description: `${description}. Related entry ids.` }
      : { type: "string", description: `${description}. Related entry id.`, nullable: !field.required };
  }
  return { type: "string", description };
}

function componentNames(schema: SchemaRecord) {
  const base = pascalCase(schema.slug || schema.name || schema.id);
  return {
    data: `${base}Data`,
    entry: `${base}Entry`,
    entryResponse: `${base}EntryResponse`,
    listResponse: `${base}ListResponse`,
    mutationRequest: `${base}MutationRequest`,
  };
}

function pascalCase(value: string): string {
  const transformed = value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join("");
  return transformed || "Generated";
}

function apiSecurity(): OpenApiSchema[] {
  return [
    { bearerAuth: [] },
    { apiTokenHeader: [] },
    { roleIdHeader: [] },
    {},
  ];
}

function apiTokenSecurity(): OpenApiSchema[] {
  return [
    { bearerAuth: [] },
    { apiTokenHeader: [] },
  ];
}

function adminSecurity(): OpenApiSchema[] {
  return [{ adminBearerAuth: [] }];
}

function adminCollectionPath(
  tag: string,
  noun: string,
  requestSchema: string,
  listResponseSchema: string,
  mutationResponseSchema: string,
): OpenApiSchema {
  return {
    get: {
      tags: [tag],
      summary: `List ${noun}s`,
      security: adminSecurity(),
      responses: okResponse({ $ref: `#/components/schemas/${listResponseSchema}` }),
    },
    post: {
      tags: [tag],
      summary: `Create a ${noun}`,
      security: adminSecurity(),
      requestBody: requestBody(requestSchema),
      responses: okResponse({ $ref: `#/components/schemas/${mutationResponseSchema}` }),
    },
  };
}

function pathParameter(name: string, description: string): OpenApiSchema {
  return {
    description,
    in: "path",
    name,
    required: true,
    schema: { type: "string" },
  };
}

function permissionSaveSchema(actions: string[]): OpenApiSchema {
  return {
    type: "object",
    properties: {
      permissions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            schemaId: { type: "string", description: "Required for content API permissions." },
            action: { type: "string", enum: actions },
            allowed: { type: "boolean" },
          },
          required: ["action", "allowed"],
        },
      },
    },
    required: ["permissions"],
  };
}

function permissionListSchema(): OpenApiSchema {
  return {
    type: "object",
    properties: {
      ok: { type: "boolean", example: true },
      permissions: { type: "array", items: { type: "object" } },
    },
    required: ["ok", "permissions"],
  };
}

function requestBody(schemaName: string): OpenApiSchema {
  return {
    required: true,
    content: {
      "application/json": {
        schema: { $ref: `#/components/schemas/${schemaName}` },
      },
    },
  };
}

function okResponse(schema: OpenApiSchema): OpenApiSchema {
  return {
    "200": {
      description: "Success",
      content: { "application/json": { schema } },
    },
    "400": {
      description: "Validation error",
      content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
    },
    "403": {
      description: "Permission denied",
      content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
    },
    "404": {
      description: "Not found",
      content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
    },
  };
}

async function anyApiDocsEnabled(database: ApiagexDatabase): Promise<boolean> {
  const settings = await getApiDocsSettings(database);
  return settings.adminEnabled || settings.contentEnabled;
}

function sendApiDocsDisabled(reply: FastifyReply): FastifyReply {
  return reply.code(404).send({ ok: false, error: "API_DOCS_DISABLED" });
}

function sendSwaggerUi(reply: FastifyReply): FastifyReply {
  return reply.type("text/html").send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Apiagex Swagger UI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
  <style>body{margin:0;background:#f8fafc}.topbar{display:none}#swagger-ui{max-width:1460px;margin:0 auto}</style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.ui = SwaggerUIBundle({
      url: "/api/openapi.json",
      dom_id: "#swagger-ui",
      deepLinking: true,
      persistAuthorization: true,
      displayOperationId: false,
      tryItOutEnabled: true
    });
  </script>
</body>
</html>`);
}
