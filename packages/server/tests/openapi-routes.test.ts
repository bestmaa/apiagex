import { openSqliteDatabase } from "@apiagex/database";
import { describe, expect, it } from "vitest";
import { createServer } from "../src/app.js";

describe("OpenAPI and Swagger routes", () => {
  it("generates dynamic OpenAPI paths and schemas from content schemas", async () => {
    const server = createServer({ adminAuth: "disabled", database: openSqliteDatabase() });
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
    expect(spec.components.securitySchemes).toMatchObject({
      bearerAuth: { type: "http", scheme: "bearer" },
      apiTokenHeader: { type: "apiKey", name: "x-apiagex-api-token" },
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

  it("serves Swagger UI shell for generated OpenAPI docs", async () => {
    const server = createServer({ adminAuth: "disabled", database: openSqliteDatabase() });

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
