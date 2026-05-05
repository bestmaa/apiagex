import { openSqliteDatabase } from "@apiagex/database";
import { describe, expect, it } from "vitest";
import { createServer } from "../src/app.js";

describe("MVP release smoke", () => {
  it("covers owner, schema, entry, dynamic API, role, user, and permission flow", async () => {
    const server = createServer({ database: openSqliteDatabase() });
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
    const dynamic = await server.inject({ method: "GET", url: "/api/content/article" });
    expect(dynamic.json().entries[0].id).toBe(entry.id);

    const allowedRole = await createRole(server, "reader");
    const blockedRole = await createRole(server, "blocked");
    await saveReadPermission(server, allowedRole.id, schema.id);
    await createUser(server, "reader@apiagex.local", allowedRole.id);
    await createUser(server, "blocked@apiagex.local", blockedRole.id);

    const allowedLogin = await loginUser(server, "reader@apiagex.local");
    const blockedLogin = await loginUser(server, "blocked@apiagex.local");
    const allowed = await readContent(server, allowedLogin.roleId);
    const blocked = await readContent(server, blockedLogin.roleId);

    expect(allowed.statusCode).toBe(200);
    expect(blocked.statusCode).toBe(403);
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

async function saveReadPermission(
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

async function loginUser(server: ReturnType<typeof createServer>, email: string) {
  const response = await server.inject({
    method: "POST",
    url: "/api/auth/login-user",
    payload: { email, password: "UserPass123!" },
  });
  return response.json().user as { roleId: string };
}

async function readContent(server: ReturnType<typeof createServer>, roleId: string) {
  return server.inject({
    method: "GET",
    url: "/api/content/article",
    headers: { "x-apiagex-role-id": roleId },
  });
}
