import { openSqliteDatabase } from "@apiagex/database";
import { describe, expect, it } from "vitest";
import { createServer } from "../src/app.js";

describe("MVP RBAC flow", () => {
  it("creates API, roles, users, then allows and blocks dynamic API access", async () => {
    const server = createServer({ database: openSqliteDatabase() });
    const schemaId = await createSchema(server);
    const readerRoleId = await createRole(server, "reader");
    const blockedRoleId = await createRole(server, "blocked");
    await setReadPermission(server, readerRoleId, schemaId);
    await createUser(server, "reader@apiagex.local", readerRoleId);
    await createUser(server, "blocked@apiagex.local", blockedRoleId);
    await server.inject({
      method: "POST",
      url: "/api/content/article",
      payload: { data: { title: "RBAC visible" } },
    });

    const readerLogin = await loginUser(server, "reader@apiagex.local");
    const blockedLogin = await loginUser(server, "blocked@apiagex.local");
    const allowed = await server.inject({
      method: "GET",
      url: "/api/content/article",
      headers: { "x-apiagex-role-id": readerLogin.roleId },
    });
    const blocked = await server.inject({
      method: "GET",
      url: "/api/content/article",
      headers: { "x-apiagex-role-id": blockedLogin.roleId },
    });

    expect(readerLogin.roleId).toBe(readerRoleId);
    expect(allowed.statusCode).toBe(200);
    expect(allowed.json().entries[0].data.title).toBe("RBAC visible");
    expect(blocked.statusCode).toBe(403);
    expect(blocked.json()).toEqual({ ok: false, error: "API_PERMISSION_DENIED" });
  });

  it("keeps relation populate behind source and target read permissions", async () => {
    const server = createServer({ database: openSqliteDatabase() });
    const authorSchemaId = await createAuthorSchema(server);
    const bookSchemaId = await createBookSchema(server, authorSchemaId);
    const allowedRoleId = await createRole(server, "relation-reader");
    const bookOnlyRoleId = await createRole(server, "book-only-reader");
    const blockedRoleId = await createRole(server, "relation-blocked");
    await setReadPermission(server, allowedRoleId, bookSchemaId);
    await setReadPermission(server, allowedRoleId, authorSchemaId);
    await setReadPermission(server, bookOnlyRoleId, bookSchemaId);
    const author = await server.inject({
      method: "POST",
      url: "/api/content/author",
      payload: { data: { name: "Martha Wells" } },
    });
    const authorId = author.json().entry.id as string;
    const book = await server.inject({
      method: "POST",
      url: "/api/content/book",
      payload: { data: { title: "All Systems Red", author: authorId } },
    });
    const bookId = book.json().entry.id as string;

    const ownerBypass = await server.inject({
      method: "GET",
      url: `/api/content/book/${bookId}?populate=relations`,
    });
    expect(ownerBypass.statusCode).toBe(200);
    expect(ownerBypass.json().entry.data.author.data.name).toBe("Martha Wells");

    const allowed = await server.inject({
      method: "GET",
      url: `/api/content/book/${bookId}?populate=relations`,
      headers: { "x-apiagex-role-id": allowedRoleId },
    });
    expect(allowed.statusCode).toBe(200);
    expect(allowed.json().entry.data.author.data.name).toBe("Martha Wells");

    const bookOnly = await server.inject({
      method: "GET",
      url: `/api/content/book/${bookId}?populate=relations`,
      headers: { "x-apiagex-role-id": bookOnlyRoleId },
    });
    expect(bookOnly.statusCode).toBe(200);
    expect(bookOnly.json().entry.data.author).toBeNull();

    const blocked = await server.inject({
      method: "GET",
      url: `/api/content/book/${bookId}?populate=relations`,
      headers: { "x-apiagex-role-id": blockedRoleId },
    });
    expect(blocked.statusCode).toBe(403);
    expect(blocked.json()).toEqual({ ok: false, error: "API_PERMISSION_DENIED" });
  });
});

async function createSchema(server: ReturnType<typeof createServer>): Promise<string> {
  const response = await server.inject({
    method: "POST",
    url: "/api/admin/schemas",
    payload: {
      name: "Article",
      slug: "article",
      fields: [{ name: "Title", slug: "title", type: "text" }],
    },
  });
  return response.json().schema.id as string;
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

async function createRole(server: ReturnType<typeof createServer>, name: string): Promise<string> {
  const response = await server.inject({
    method: "POST",
    url: "/api/admin/roles",
    payload: { name },
  });
  return response.json().role.id as string;
}

async function setReadPermission(
  server: ReturnType<typeof createServer>,
  roleId: string,
  schemaId: string,
): Promise<void> {
  await server.inject({
    method: "PUT",
    url: `/api/admin/roles/${roleId}/permissions`,
    payload: { permissions: [{ schemaId, action: "read", allowed: true }] },
  });
}

async function createUser(
  server: ReturnType<typeof createServer>,
  email: string,
  roleId: string,
): Promise<void> {
  await server.inject({
    method: "POST",
    url: "/api/admin/users",
    payload: { email, password: "UserPass123!", roleId },
  });
}

async function loginUser(
  server: ReturnType<typeof createServer>,
  email: string,
): Promise<{ roleId: string }> {
  const response = await server.inject({
    method: "POST",
    url: "/api/auth/login-user",
    payload: { email, password: "UserPass123!" },
  });
  return response.json().user as { roleId: string };
}
