import type { FastifyInstance, FastifyReply } from "fastify";
import {
  listSchemas,
  type ApiagexDatabase,
  type FieldRecord,
  type SchemaRecord,
} from "@apiagex/database";

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
    return reply.type("application/json").send(await buildOpenApiDocument(database));
  });

  server.get("/api/swagger", async (_request, reply) => sendSwaggerUi(reply));
  server.get("/api/docs", async (_request, reply) => sendSwaggerUi(reply));
  server.get("/swagger", async (_request, reply) => sendSwaggerUi(reply));
}

export async function buildOpenApiDocument(database: ApiagexDatabase): Promise<OpenApiDocument> {
  const schemas = await listSchemas(database);
  const components = contentSchemaComponents(schemas);
  return {
    openapi: "3.0.3",
    info: {
      title: "Apiagex Generated Content API",
      version: process.env.npm_package_version ?? "0.0.0",
      description: "Dynamic OpenAPI contract generated from current Apiagex schemas.",
    },
    servers: [{ url: "/" }],
    tags: [
      { name: "Content", description: "Generated content APIs. Requests need API permissions unless the public role allows the action." },
      { name: "System", description: "Service health and OpenAPI endpoints." },
    ],
    paths: {
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
      ...Object.fromEntries(schemas.flatMap((schema) => contentPaths(schema))),
    },
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
      required: ["ok", "schema", "entries"],
    };
  }
  return components;
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
  if (field.type === "boolean") return { type: "boolean", description };
  if (field.type === "date") return { type: "string", format: "date", description };
  if (field.type === "json") return { description, nullable: !field.required };
  if (field.type === "media") return { type: "string", description, example: "/uploads/example.png" };
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
