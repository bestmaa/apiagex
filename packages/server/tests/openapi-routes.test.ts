import { openSqliteDatabase } from "@apiagex/database";
import { describe, expect, it } from "vitest";
import { createServer } from "../src/app.js";

describe("OpenAPI and Swagger routes", () => {
  it("generates dynamic OpenAPI paths and schemas from content schemas", async () => {
    const server = createServer({ adminAuth: "disabled", database: openSqliteDatabase() });
    await enableApiDocs(server);
    await server.inject({
      method: "POST",
      url: "/api/admin/schemas",
      payload: {
        name: "Article",
        slug: "article",
        fields: [
          { name: "Title", slug: "title", type: "text", required: true },
          { name: "Views", slug: "views", type: "number" },
        ],
      },
    });

    const response = await server.inject({ method: "GET", url: "/api/openapi.json" });
    const spec = response.json();

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("application/json");
    expect(spec.openapi).toBe("3.0.3");
    expect(spec.paths["/api/content/article"].get.summary).toBe("List Article entries");
    expect(spec.paths["/api/content/article"].post.requestBody.content["application/json"].schema.$ref).toBe(
      "#/components/schemas/ArticleMutationRequest",
    );
    expect(spec.paths["/api/content/article/{entryId}"].delete.summary).toBe("Delete one Article entry");
    expect(spec.paths["/api/admin/schemas"].post.summary).toBe("Create an admin schema");
    expect(spec.paths["/api/admin/settings/api-docs"].put.summary).toBe("Enable or disable Swagger/OpenAPI visibility");
    expect(spec.components.securitySchemes).toMatchObject({
      bearerAuth: { type: "http", scheme: "bearer" },
      apiTokenHeader: { type: "apiKey", name: "x-apiagex-api-token" },
      adminBearerAuth: { type: "http", scheme: "bearer" },
      roleIdHeader: { type: "apiKey", name: "x-apiagex-role-id" },
    });
    expect(spec.components.schemas.ArticleData).toMatchObject({
      additionalProperties: false,
      required: ["title"],
      properties: {
        title: { type: "string" },
        views: { type: "number" },
      },
    });
  });

  it("hides OpenAPI and Swagger until API docs are enabled", async () => {
    const server = createServer({ adminAuth: "disabled", database: openSqliteDatabase() });

    const openapi = await server.inject({ method: "GET", url: "/api/openapi.json" });
    const swagger = await server.inject({ method: "GET", url: "/swagger" });

    expect(openapi.statusCode).toBe(404);
    expect(openapi.json()).toEqual({ ok: false, error: "API_DOCS_DISABLED" });
    expect(swagger.statusCode).toBe(404);
    expect(swagger.json()).toEqual({ ok: false, error: "API_DOCS_DISABLED" });
  });

  it("serves Swagger UI shell for generated OpenAPI docs", async () => {
    const server = createServer({ adminAuth: "disabled", database: openSqliteDatabase() });
    await enableApiDocs(server);

    const swagger = await server.inject({ method: "GET", url: "/swagger" });
    const apiDocs = await server.inject({ method: "GET", url: "/api/docs" });

    expect(swagger.statusCode).toBe(200);
    expect(swagger.headers["content-type"]).toContain("text/html");
    expect(swagger.body).toContain("SwaggerUIBundle");
    expect(swagger.body).toContain("/api/openapi.json");
    expect(apiDocs.statusCode).toBe(200);
    expect(apiDocs.body).toContain("Apiagex Swagger UI");
  });
});

async function enableApiDocs(server: ReturnType<typeof createServer>): Promise<void> {
  await server.inject({
    method: "PUT",
    url: "/api/admin/settings/api-docs",
    payload: { enabled: true },
  });
}
