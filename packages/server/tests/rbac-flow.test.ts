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
