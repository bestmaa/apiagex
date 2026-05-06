import { openSqliteDatabase } from "@apiagex/database";
import { describe, expect, it } from "vitest";
import { createServer } from "../src/app.js";

describe("dynamic content APIs", () => {
  it("creates, lists, reads, updates, and deletes content by schema slug", async () => {
    const server = createServer({ database: openSqliteDatabase() });
    await createArticleSchema(server);

    const create = await server.inject({
      method: "POST",
      url: "/api/content/article",
      payload: { data: { title: "Hello" } },
    });
    expect(create.statusCode).toBe(200);
    const entry = create.json().entry as { id: string };

    const list = await server.inject({ method: "GET", url: "/api/content/article" });
    expect(list.json().entries).toHaveLength(1);

    const read = await server.inject({ method: "GET", url: `/api/content/article/${entry.id}` });
    expect(read.json().entry.data.title).toBe("Hello");

    const update = await server.inject({
      method: "PUT",
      url: `/api/content/article/${entry.id}`,
      payload: { data: { title: "Updated" } },
    });
    expect(update.json().entry.data.title).toBe("Updated");

    const remove = await server.inject({
      method: "DELETE",
      url: `/api/content/article/${entry.id}`,
    });
    expect(remove.json()).toEqual({ ok: true, deleted: true });
  });

  it("returns schema and validation errors", async () => {
    const server = createServer({ database: openSqliteDatabase() });
    await createArticleSchema(server);

    const missingSchema = await server.inject({ method: "GET", url: "/api/content/missing" });
    expect(missingSchema.statusCode).toBe(404);
    expect(missingSchema.json()).toEqual({ ok: false, error: "SCHEMA_NOT_FOUND" });

    const invalid = await server.inject({
      method: "POST",
      url: "/api/content/article",
      payload: { data: {} },
    });
    expect(invalid.statusCode).toBe(400);
    expect(invalid.json()).toEqual({ ok: false, error: "ENTRY_FIELD_REQUIRED:title" });
  });

  it("allows and blocks dynamic APIs by role permission header", async () => {
    const server = createServer({ database: openSqliteDatabase() });
    const schemaId = await createArticleSchema(server);
    const allowedRole = await createRole(server, "reader");
    const blockedRole = await createRole(server, "blocked");
    await server.inject({
      method: "PUT",
      url: `/api/admin/roles/${allowedRole}/permissions`,
      payload: { permissions: [{ schemaId, action: "read", allowed: true }] },
    });

    const allowed = await server.inject({
      method: "GET",
      url: "/api/content/article",
      headers: { "x-apiagex-role-id": allowedRole },
    });
    expect(allowed.statusCode).toBe(200);

    const blocked = await server.inject({
      method: "GET",
      url: "/api/content/article",
      headers: { "x-apiagex-role-id": blockedRole },
    });
    expect(blocked.statusCode).toBe(403);
    expect(blocked.json()).toEqual({ ok: false, error: "API_PERMISSION_DENIED" });
  });

  it("validates relation payloads after dynamic write permissions pass", async () => {
    const server = createServer({ database: openSqliteDatabase() });
    const authorSchemaId = await createAuthorSchema(server);
    await createBookSchema(server, authorSchemaId);
    const blockedRole = await createRole(server, "blocked-writer");
    const author = await server.inject({
      method: "POST",
      url: "/api/content/author",
      payload: { data: { name: "Ursula Le Guin" } },
    });
    const authorId = author.json().entry.id as string;

    const blocked = await server.inject({
      method: "POST",
      url: "/api/content/book",
      headers: { "x-apiagex-role-id": blockedRole },
      payload: { data: { title: "Denied first", author: [authorId] } },
    });

    expect(blocked.statusCode).toBe(403);
    expect(blocked.json()).toEqual({ ok: false, error: "API_PERMISSION_DENIED" });

    const create = await server.inject({
      method: "POST",
      url: "/api/content/book",
      payload: { data: { title: "The Dispossessed", author: authorId } },
    });
    expect(create.statusCode).toBe(200);
    const bookId = create.json().entry.id as string;

    const invalidCreate = await server.inject({
      method: "POST",
      url: "/api/content/book",
      payload: { data: { title: "Bad shape", author: [authorId] } },
    });
    expect(invalidCreate.statusCode).toBe(400);
    expect(invalidCreate.json()).toEqual({
      ok: false,
      error: "RELATION_VALUE_SHAPE_INVALID:author",
    });

    const invalidUpdate = await server.inject({
      method: "PUT",
      url: `/api/content/book/${bookId}`,
      payload: { data: { title: "Bad target", author: "missing-author-entry" } },
    });
    expect(invalidUpdate.statusCode).toBe(400);
    expect(invalidUpdate.json()).toEqual({
      ok: false,
      error: "RELATION_TARGET_ENTRY_INVALID:author",
    });

    const validUpdate = await server.inject({
      method: "PUT",
      url: `/api/content/book/${bookId}`,
      payload: { data: { title: "The Left Hand of Darkness", author: authorId } },
    });
    expect(validUpdate.statusCode).toBe(200);
    expect(validUpdate.json().entry.data.author).toBe(authorId);
  });

  it("populates one-level relation entries for dynamic read and list", async () => {
    const server = createServer({ database: openSqliteDatabase() });
    const authorSchemaId = await createAuthorSchema(server);
    const bookSchemaId = await createBookSchema(server, authorSchemaId);
    const author = await server.inject({
      method: "POST",
      url: "/api/content/author",
      payload: { data: { name: "N. K. Jemisin" } },
    });
    const authorId = author.json().entry.id as string;
    const book = await server.inject({
      method: "POST",
      url: "/api/content/book",
      payload: { data: { title: "The Fifth Season", author: authorId } },
    });
    const bookId = book.json().entry.id as string;

    const list = await server.inject({
      method: "GET",
      url: "/api/content/book?populate=relations",
    });
    expect(list.statusCode).toBe(200);
    expect(list.json().entries[0].data.author).toMatchObject({
      id: authorId,
      schemaId: authorSchemaId,
      data: { name: "N. K. Jemisin" },
    });

    const read = await server.inject({
      method: "GET",
      url: `/api/content/book/${bookId}?populate=relations`,
    });
    expect(read.statusCode).toBe(200);
    expect(read.json().entry.data.author.data.name).toBe("N. K. Jemisin");

    const bookReader = await createRole(server, "book-reader");
    await server.inject({
      method: "PUT",
      url: `/api/admin/roles/${bookReader}/permissions`,
      payload: { permissions: [{ schemaId: bookSchemaId, action: "read", allowed: true }] },
    });
    const blockedTarget = await server.inject({
      method: "GET",
      url: `/api/content/book/${bookId}?populate=relations`,
      headers: { "x-apiagex-role-id": bookReader },
    });
    expect(blockedTarget.statusCode).toBe(200);
    expect(blockedTarget.json().entry.data.author).toBeNull();
  });
});

async function createArticleSchema(server: ReturnType<typeof createServer>): Promise<string> {
  const response = await server.inject({
    method: "POST",
    url: "/api/admin/schemas",
    payload: {
      name: "Article",
      slug: "article",
      fields: [{ name: "Title", slug: "title", type: "text", required: true }],
    },
  });
  return response.json().schema.id as string;
}

async function createRole(server: ReturnType<typeof createServer>, name: string): Promise<string> {
  const response = await server.inject({
    method: "POST",
    url: "/api/admin/roles",
    payload: { name },
  });
  return response.json().role.id as string;
}

async function createAuthorSchema(server: ReturnType<typeof createServer>): Promise<string> {
  const response = await server.inject({
    method: "POST",
    url: "/api/admin/schemas",
    payload: {
      name: "Author",
      slug: "author",
      fields: [{ name: "Name", slug: "name", type: "text", required: true }],
    },
  });
  return response.json().schema.id as string;
}

async function createBookSchema(
  server: ReturnType<typeof createServer>,
  authorSchemaId: string,
): Promise<string> {
  const response = await server.inject({
    method: "POST",
    url: "/api/admin/schemas",
    payload: {
      name: "Book",
      slug: "book",
      fields: [
        { name: "Title", slug: "title", type: "text", required: true },
        {
          name: "Author",
          slug: "author",
          type: "relation",
          relationSchemaId: authorSchemaId,
          relationType: "manyToOne",
          required: true,
        },
      ],
    },
  });
  return response.json().schema.id as string;
}
