import { openSqliteDatabase } from "@apiagex/database";
import { describe, expect, it } from "vitest";
import { createServer } from "../src/app.js";

describe("MVP RBAC flow", () => {
  it("creates API, roles, users, then allows and blocks dynamic API access", async () => {
    const server = createServer({ adminAuth: "disabled", database: openSqliteDatabase() });
    const schemaId = await createSchema(server);
    const readerRoleId = await createRole(server, "reader");
    const blockedRoleId = await createRole(server, "blocked");
    await setGetAllPermission(server, readerRoleId, schemaId);
    await createUser(server, "reader@apiagex.local", readerRoleId);
    await createUser(server, "blocked@apiagex.local", blockedRoleId);
    await createAdminEntry(server, schemaId, { title: "RBAC visible" });

    const readerLogin = await loginUser(server, "reader@apiagex.local");
    const blockedLogin = await loginUser(server, "blocked@apiagex.local");
    const allowed = await server.inject({
      method: "GET",
      url: "/api/content/article",
      headers: { authorization: `Bearer ${readerLogin.token}` },
    });
    const blocked = await server.inject({
      method: "GET",
      url: "/api/content/article",
      headers: { authorization: `Bearer ${blockedLogin.token}` },
    });

    expect(readerLogin.roleId).toBe(readerRoleId);
    expect(readerLogin.token).toMatch(/^agxu_/);
    expect(allowed.statusCode).toBe(200);
    expect(allowed.json().entries[0].data.title).toBe("RBAC visible");
    expect(blocked.statusCode).toBe(403);
    expect(blocked.json()).toEqual({ ok: false, error: "API_PERMISSION_DENIED" });
  });

  it("keeps relation populate behind source and target get permissions", async () => {
    const server = createServer({ adminAuth: "disabled", database: openSqliteDatabase() });
    const authorSchemaId = await createAuthorSchema(server);
    const bookSchemaId = await createBookSchema(server, authorSchemaId);
    const allowedRoleId = await createRole(server, "relation-reader");
    const bookOnlyRoleId = await createRole(server, "book-only-reader");
    const blockedRoleId = await createRole(server, "relation-blocked");
    await setGetPermission(server, allowedRoleId, bookSchemaId);
    await setGetPermission(server, allowedRoleId, authorSchemaId);
    await setGetPermission(server, bookOnlyRoleId, bookSchemaId);
    const authorId = await createAdminEntry(server, authorSchemaId, { name: "Martha Wells" });
    const bookId = await createAdminEntry(server, bookSchemaId, { title: "All Systems Red", author: authorId });

    await setGetPermission(server, await getOrCreatePublicRole(server), bookSchemaId);
    await setGetPermission(server, await getOrCreatePublicRole(server), authorSchemaId);
    const publicRead = await server.inject({
      method: "GET",
      url: `/api/content/book/${bookId}?populate=relations`,
    });
    expect(publicRead.statusCode).toBe(200);
    expect(publicRead.json().entry.data.author.data.name).toBe("Martha Wells");

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

async function setGetAllPermission(
  server: ReturnType<typeof createServer>,
  roleId: string,
  schemaId: string,
): Promise<void> {
  await server.inject({
    method: "PUT",
    url: `/api/admin/roles/${roleId}/permissions`,
    payload: { permissions: [{ schemaId, action: "getAll", allowed: true }] },
  });
}

async function setGetPermission(
  server: ReturnType<typeof createServer>,
  roleId: string,
  schemaId: string,
): Promise<void> {
  await server.inject({
    method: "PUT",
    url: `/api/admin/roles/${roleId}/permissions`,
    payload: { permissions: [{ schemaId, action: "get", allowed: true }] },
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
): Promise<{ roleId: string; token: string }> {
  const response = await server.inject({
    method: "POST",
    url: "/api/auth/login-user",
    payload: { email, password: "UserPass123!" },
  });
  const body = response.json() as { token: string; user: { roleId: string } };
  return { roleId: body.user.roleId, token: body.token };
}

async function createAdminEntry(
  server: ReturnType<typeof createServer>,
  schemaId: string,
  data: Record<string, unknown>,
): Promise<string> {
  const response = await server.inject({
    method: "POST",
    url: `/api/admin/schemas/${schemaId}/entries`,
    payload: { data },
  });
  return response.json().entry.id as string;
}

async function getOrCreatePublicRole(server: ReturnType<typeof createServer>): Promise<string> {
  const list = await server.inject({ method: "GET", url: "/api/admin/roles" });
  const existing = (list.json().roles as Array<{ id: string; name: string }>).find((role) => role.name === "public");
  if (existing) return existing.id;
  return createRole(server, "public");
}
