import { openSqliteDatabase } from "@apiagex/database";
import { describe, expect, it } from "vitest";
import { createServer } from "../src/app.js";

describe("MVP release smoke", () => {
  it("covers owner, schema, entry, dynamic API, role, user, and permission flow", async () => {
    const server = createServer({ adminAuth: "disabled", database: openSqliteDatabase() });
    const owner = await server.inject({
      method: "POST",
      url: "/api/auth/bootstrap-owner",
      payload: { email: "owner@apiagex.local", password: "OwnerPass123!" },
    });
    expect(owner.statusCode).toBe(200);

    const login = await server.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: "owner@apiagex.local", password: "OwnerPass123!" },
    });
    expect(login.statusCode).toBe(200);

    const schema = await createArticleSchema(server);
    const entry = await createEntry(server, schema.id);
    await saveGetAllPermission(server, await getOrCreatePublicRole(server), schema.id);
    const dynamic = await server.inject({ method: "GET", url: "/api/content/article" });
    expect(dynamic.json().entries[0].id).toBe(entry.id);

    const allowedRole = await createRole(server, "smoke-reader");
    const blockedRole = await createRole(server, "smoke-blocked");
    await saveGetAllPermission(server, allowedRole.id, schema.id);
    await createUser(server, "reader@apiagex.local", allowedRole.id);
    await createUser(server, "blocked@apiagex.local", blockedRole.id);

    const allowedLogin = await loginUser(server, "reader@apiagex.local");
    const blockedLogin = await loginUser(server, "blocked@apiagex.local");
    const allowed = await readContent(server, allowedLogin.token);
    const blocked = await readContent(server, blockedLogin.token);

    expect(allowedLogin.roleId).toBe(allowedRole.id);
    expect(allowedLogin.token).toMatch(/^agxu_/);
    expect(allowed.statusCode).toBe(200);
    expect(blocked.statusCode).toBe(403);
  });

  it("covers relation schema, entries, populate, and RBAC allow/block", async () => {
    const server = createServer({ adminAuth: "disabled", database: openSqliteDatabase() });
    const authorSchema = await createRelationAuthorSchema(server);
    const bookSchema = await createRelationBookSchema(server, authorSchema.id);
    const publicRole = await getOrCreatePublicRole(server);
    await savePermissions(server, publicRole, [
      { schemaId: authorSchema.id, action: "create", allowed: true },
      { schemaId: authorSchema.id, action: "get", allowed: true },
      { schemaId: bookSchema.id, action: "create", allowed: true },
      { schemaId: bookSchema.id, action: "get", allowed: true },
    ]);
    const author = await server.inject({
      method: "POST",
      url: "/api/content/smoke-author",
      payload: { data: { name: "Octavia Butler" } },
    });
    expect(author.statusCode).toBe(200);
    const authorId = author.json().entry.id as string;
    const book = await server.inject({
      method: "POST",
      url: "/api/content/smoke-book",
      payload: { data: { title: "Kindred", author: authorId } },
    });
    expect(book.statusCode).toBe(200);
    const bookId = book.json().entry.id as string;

    const raw = await server.inject({ method: "GET", url: `/api/content/smoke-book/${bookId}` });
    expect(raw.statusCode).toBe(200);
    expect(raw.json().entry.data.author).toBe(authorId);

    const populated = await server.inject({
      method: "GET",
      url: `/api/content/smoke-book/${bookId}?populate=relations`,
    });
    expect(populated.statusCode).toBe(200);
    expect(populated.json().entry.data.author.data.name).toBe("Octavia Butler");

    const allowedRole = await createRole(server, "relation-reader");
    const blockedRole = await createRole(server, "relation-blocked");
    await saveGetPermission(server, allowedRole.id, bookSchema.id);
    await saveGetPermission(server, allowedRole.id, authorSchema.id);
    await createUser(server, "relation-reader@apiagex.local", allowedRole.id);
    await createUser(server, "relation-blocked@apiagex.local", blockedRole.id);
    const allowedLogin = await loginUser(server, "relation-reader@apiagex.local");
    const blockedLogin = await loginUser(server, "relation-blocked@apiagex.local");

    const allowed = await server.inject({
      method: "GET",
      url: `/api/content/smoke-book/${bookId}?populate=relations`,
      headers: { authorization: `Bearer ${allowedLogin.token}` },
    });
    expect(allowed.statusCode).toBe(200);
    expect(allowed.json().entry.data.author.data.name).toBe("Octavia Butler");

    const blocked = await server.inject({
      method: "GET",
      url: `/api/content/smoke-book/${bookId}?populate=relations`,
      headers: { authorization: `Bearer ${blockedLogin.token}` },
    });
    expect(blocked.statusCode).toBe(403);
    expect(blocked.json()).toEqual({ ok: false, error: "API_PERMISSION_DENIED" });
  });
});

async function createArticleSchema(server: ReturnType<typeof createServer>) {
  const response = await server.inject({
    method: "POST",
    url: "/api/admin/schemas",
    payload: {
      name: "Article",
      slug: "article",
      fields: [{ name: "Title", slug: "title", type: "text", required: true }],
    },
  });
  return response.json().schema as { id: string };
}

async function createRelationAuthorSchema(server: ReturnType<typeof createServer>) {
  const response = await server.inject({
    method: "POST",
    url: "/api/admin/schemas",
    payload: {
      name: "Smoke Author",
      slug: "smoke-author",
      fields: [{ name: "Name", slug: "name", type: "text", required: true }],
    },
  });
  return response.json().schema as { id: string };
}

async function createRelationBookSchema(server: ReturnType<typeof createServer>, authorSchemaId: string) {
  const response = await server.inject({
    method: "POST",
    url: "/api/admin/schemas",
    payload: {
      name: "Smoke Book",
      slug: "smoke-book",
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
  return response.json().schema as { id: string };
}

async function createEntry(server: ReturnType<typeof createServer>, schemaId: string) {
  const response = await server.inject({
    method: "POST",
    url: `/api/admin/schemas/${schemaId}/entries`,
    payload: { data: { title: "Smoke" } },
  });
  return response.json().entry as { id: string };
}

async function createRole(server: ReturnType<typeof createServer>, name: string) {
  const response = await server.inject({
    method: "POST",
    url: "/api/admin/roles",
    payload: { name },
  });
  return response.json().role as { id: string };
}

async function saveGetAllPermission(
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

async function saveGetPermission(
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

async function savePermissions(
  server: ReturnType<typeof createServer>,
  roleId: string,
  permissions: Array<Record<string, unknown>>,
): Promise<void> {
  await server.inject({
    method: "PUT",
    url: `/api/admin/roles/${roleId}/permissions`,
    payload: { permissions },
  });
}

async function getOrCreatePublicRole(server: ReturnType<typeof createServer>): Promise<string> {
  const list = await server.inject({ method: "GET", url: "/api/admin/roles" });
  const existing = (list.json().roles as Array<{ id: string; name: string }>).find((role) => role.name === "public");
  if (existing) return existing.id;
  return createRole(server, "public").then((role) => role.id);
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

async function loginUser(server: ReturnType<typeof createServer>, email: string) {
  const response = await server.inject({
    method: "POST",
    url: "/api/auth/login-user",
    payload: { email, password: "UserPass123!" },
  });
  const body = response.json() as { token: string; user: { roleId: string } };
  return { roleId: body.user.roleId, token: body.token };
}

async function readContent(server: ReturnType<typeof createServer>, token: string) {
  return server.inject({
    method: "GET",
    url: "/api/content/article",
    headers: { authorization: `Bearer ${token}` },
  });
}
