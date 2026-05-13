import { openSqliteDatabase } from "apiagex-database";
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

  it("supports dynamic content search, field projection, and pagination", async () => {
    const server = createServer({ database: openSqliteDatabase() });
    await createArticleSchema(server);
    for (const [title, views] of [
      ["Alpha", 1],
      ["Beta", 2],
      ["Alpha draft", 3],
    ] as const) {
      await server.inject({
        method: "POST",
        url: "/api/content/article",
        payload: { data: { title, views } },
      });
    }

    const list = await server.inject({
      method: "GET",
      url: "/api/content/article?search=Alpha&fields=title&limit=1&offset=1",
    });

    expect(list.statusCode).toBe(200);
    expect(list.json().total).toBe(2);
    expect(list.json().entries).toHaveLength(1);
    expect(Object.keys(list.json().entries[0].data)).toEqual(["title"]);

    const entryId = list.json().entries[0].id as string;
    const read = await server.inject({
      method: "GET",
      url: `/api/content/article/${entryId}?fields=title`,
    });

    expect(read.statusCode).toBe(200);
    expect(Object.keys(read.json().entry.data)).toEqual(["title"]);
  });

  it("rejects unknown dynamic content projection fields", async () => {
    const server = createServer({ database: openSqliteDatabase() });
    await createArticleSchema(server);

    const response = await server.inject({
      method: "GET",
      url: "/api/content/article?fields=missing",
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ ok: false, error: "ENTRY_FIELD_UNKNOWN" });
  });

  it("allows and blocks dynamic APIs by role permission header", async () => {
    const server = createServer({ database: openSqliteDatabase() });
    const schemaId = await createArticleSchema(server);
    const allowedRole = await createRole(server, "reader");
    const blockedRole = await createRole(server, "blocked");
    await server.inject({
      method: "PUT",
      url: `/api/admin/roles/${allowedRole}/permissions`,
      payload: { permissions: [{ schemaId, action: "getAll", allowed: true }] },
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

  it("separates getAll list access from get single-entry access", async () => {
    const server = createServer({ database: openSqliteDatabase() });
    const schemaId = await createArticleSchema(server);
    const entry = await server.inject({
      method: "POST",
      url: "/api/content/article",
      payload: { data: { title: "Split read", views: 7 } },
    });
    const entryId = entry.json().entry.id as string;
    const listRole = await createRole(server, "list-only");
    const getRole = await createRole(server, "get-only");
    await savePermission(server, listRole, schemaId, "getAll");
    await savePermission(server, getRole, schemaId, "get");

    const listAllowed = await server.inject({
      method: "GET",
      url: "/api/content/article",
      headers: { "x-apiagex-role-id": listRole },
    });
    const readBlocked = await server.inject({
      method: "GET",
      url: `/api/content/article/${entryId}`,
      headers: { "x-apiagex-role-id": listRole },
    });
    const listBlocked = await server.inject({
      method: "GET",
      url: "/api/content/article",
      headers: { "x-apiagex-role-id": getRole },
    });
    const readAllowed = await server.inject({
      method: "GET",
      url: `/api/content/article/${entryId}`,
      headers: { "x-apiagex-role-id": getRole },
    });

    expect(listAllowed.statusCode).toBe(200);
    expect(readBlocked.statusCode).toBe(403);
    expect(listBlocked.statusCode).toBe(403);
    expect(readAllowed.statusCode).toBe(200);
    expect(readAllowed.json().entry.data.title).toBe("Split read");
  });

  it("uses API tokens to enforce content role permissions", async () => {
    const server = createServer({ database: openSqliteDatabase() });
    const schemaId = await createArticleSchema(server);
    const roleId = await createRole(server, "token-reader");
    await savePermission(server, roleId, schemaId, "getAll");
    await server.inject({
      method: "POST",
      url: "/api/content/article",
      payload: { data: { title: "Token article" } },
    });
    const created = await server.inject({
      method: "POST",
      url: `/api/admin/roles/${roleId}/tokens`,
      payload: { name: "Partner app" },
    });
    const token = created.json().token as string;

    const allowed = await server.inject({
      method: "GET",
      url: "/api/content/article",
      headers: { authorization: `Bearer ${token}` },
    });
    const blocked = await server.inject({
      method: "GET",
      url: `/api/content/article/${allowed.json().entries[0].id}`,
      headers: { "x-apiagex-api-token": token },
    });
    await server.inject({
      method: "DELETE",
      url: `/api/admin/roles/${roleId}/tokens/${created.json().tokenRecord.id}`,
    });
    const revoked = await server.inject({
      method: "GET",
      url: "/api/content/article",
      headers: { authorization: `Bearer ${token}` },
    });

    expect(allowed.statusCode).toBe(200);
    expect(blocked.statusCode).toBe(403);
    expect(blocked.json()).toEqual({ ok: false, error: "API_PERMISSION_DENIED" });
    expect(revoked.statusCode).toBe(403);
    expect(revoked.json()).toEqual({ ok: false, error: "API_TOKEN_INVALID" });
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

    const aliasRead = await server.inject({
      method: "GET",
      url: `/api/content/book/${bookId}?populate=*`,
    });
    expect(aliasRead.statusCode).toBe(200);
    expect(aliasRead.json().entry.data.author.data.name).toBe("N. K. Jemisin");

    const unknownPopulate = await server.inject({
      method: "GET",
      url: `/api/content/book/${bookId}?populate=deep`,
    });
    expect(unknownPopulate.statusCode).toBe(200);
    expect(unknownPopulate.json().entry.data.author).toBe(authorId);

    const bookReader = await createRole(server, "book-reader");
    await server.inject({
      method: "PUT",
      url: `/api/admin/roles/${bookReader}/permissions`,
      payload: { permissions: [{ schemaId: bookSchemaId, action: "get", allowed: true }] },
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
      fields: [
        { name: "Title", slug: "title", type: "text", required: true },
        { name: "Views", slug: "views", type: "number" },
      ],
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

async function savePermission(
  server: ReturnType<typeof createServer>,
  roleId: string,
  schemaId: string,
  action: "getAll" | "get",
): Promise<void> {
  await server.inject({
    method: "PUT",
    url: `/api/admin/roles/${roleId}/permissions`,
    payload: { permissions: [{ schemaId, action, allowed: true }] },
  });
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
