import { openSqliteDatabase } from "apiagex-database";
import { describe, expect, it } from "vitest";
import { createServer } from "../src/app.js";

describe("role admin APIs", () => {
  it("creates, lists, and reads roles", async () => {
    const server = createServer({ database: openSqliteDatabase() });

    const create = await server.inject({
      method: "POST",
      url: "/api/admin/roles",
      payload: { name: "editor", description: "Can edit content" },
    });
    expect(create.statusCode).toBe(200);
    const role = create.json().role as { id: string };

    const list = await server.inject({ method: "GET", url: "/api/admin/roles" });
    expect(list.json().roles).toHaveLength(1);
    expect(list.json().roles[0].roleKind).toBe("api");

    const read = await server.inject({ method: "GET", url: `/api/admin/roles/${role.id}` });
    expect(read.json().role.name).toBe("editor");
  });

  it("rejects invalid role names", async () => {
    const server = createServer({ database: openSqliteDatabase() });

    const response = await server.inject({
      method: "POST",
      url: "/api/admin/roles",
      payload: { name: "Bad Role" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ ok: false, error: "ROLE_NAME_INVALID" });
  });

  it("hides admin roles from API role routes", async () => {
    const database = openSqliteDatabase();
    const server = createServer({ database });
    await server.inject({
      method: "POST",
      url: "/api/auth/bootstrap-owner",
      payload: { email: "owner@apiagex.local", password: "OwnerPass123!" },
    });

    const list = await server.inject({ method: "GET", url: "/api/admin/roles" });
    const names = list.json().roles.map((role: { name: string }) => role.name);
    expect(names).not.toContain("owner");
    expect(names).not.toContain("admin");
    expect(names).toContain("reader");

    const readOwner = await server.inject({ method: "GET", url: "/api/admin/roles/role_owner" });
    expect(readOwner.statusCode).toBe(404);

    const createAdmin = await server.inject({
      method: "POST",
      url: "/api/admin/roles",
      payload: { name: "admin" },
    });
    expect(createAdmin.statusCode).toBe(400);
    expect(createAdmin.json()).toEqual({ ok: false, error: "ROLE_ADMIN_RESERVED" });
  });

  it("saves role permissions for schema actions", async () => {
    const server = createServer({ database: openSqliteDatabase() });
    const role = await server.inject({
      method: "POST",
      url: "/api/admin/roles",
      payload: { name: "editor" },
    });
    const schema = await server.inject({
      method: "POST",
      url: "/api/admin/schemas",
      payload: {
        name: "Article",
        slug: "article",
        fields: [{ name: "Title", slug: "title", type: "text" }],
      },
    });

    const save = await server.inject({
      method: "PUT",
      url: `/api/admin/roles/${role.json().role.id}/permissions`,
      payload: {
        permissions: [
          { schemaId: schema.json().schema.id, action: "getAll", allowed: true },
          { schemaId: schema.json().schema.id, action: "get", allowed: true },
        ],
      },
    });

    expect(save.statusCode).toBe(200);
    expect(save.json().permissions).toHaveLength(2);
  });

  it("creates, lists, and revokes API role tokens", async () => {
    const server = createServer({ database: openSqliteDatabase() });
    const role = await server.inject({
      method: "POST",
      url: "/api/admin/roles",
      payload: { name: "reader" },
    });
    const roleId = role.json().role.id as string;

    const create = await server.inject({
      method: "POST",
      url: `/api/admin/roles/${roleId}/tokens`,
      payload: { name: "Docs client" },
    });
    expect(create.statusCode).toBe(200);
    expect(create.json().token).toMatch(/^agx_/);
    expect(create.json().tokenRecord.tokenPrefix).toBe(create.json().token.slice(0, 12));

    const list = await server.inject({ method: "GET", url: `/api/admin/roles/${roleId}/tokens` });
    expect(list.json().tokens).toHaveLength(1);
    expect(list.json().tokens[0].name).toBe("Docs client");
    expect(list.json().tokens[0].token).toBeUndefined();

    const revoke = await server.inject({
      method: "DELETE",
      url: `/api/admin/roles/${roleId}/tokens/${create.json().tokenRecord.id}`,
    });
    expect(revoke.statusCode).toBe(200);
    expect(revoke.json().token.revokedAt).toBeTruthy();
  });

  it("rejects token creation for admin roles", async () => {
    const database = openSqliteDatabase();
    const server = createServer({ database });
    await server.inject({
      method: "POST",
      url: "/api/auth/bootstrap-owner",
      payload: { email: "owner@apiagex.local", password: "OwnerPass123!" },
    });

    const response = await server.inject({
      method: "POST",
      url: "/api/admin/roles/role_admin/tokens",
      payload: { name: "Wrong token" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ ok: false, error: "ROLE_API_REQUIRED" });
  });
});
