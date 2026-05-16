import { openSqliteDatabase } from "@apiagex/database";
import { describe, expect, it } from "vitest";
import { createServer } from "../src/app.js";

describe("settings access control APIs", () => {
  it("lists separated admin panel roles and content API roles", async () => {
    const server = createServer({ adminAuth: "disabled", database: openSqliteDatabase() });
    await bootstrap(server);

    const response = await server.inject({ method: "GET", url: "/api/admin/settings/access" });
    const body = response.json() as {
      adminRoles: Array<{ name: string; roleKind: string }>;
      apiRoles: Array<{ name: string; roleKind: string }>;
    };

    expect(response.statusCode).toBe(200);
    expect(body.adminRoles.map((role) => role.name)).toEqual([
      "owner",
      "admin",
      "schema-manager",
      "user-manager",
    ]);
    expect(body.adminRoles.every((role) => role.roleKind === "admin")).toBe(true);
    expect(body.apiRoles.map((role) => role.name)).toEqual([
      "reader",
      "single-reader",
      "writer",
      "editor",
      "public",
    ]);
    expect(body.apiRoles.every((role) => role.roleKind === "api")).toBe(true);
  });

  it("creates admin roles and saves admin permissions", async () => {
    const server = createServer({ adminAuth: "disabled", database: openSqliteDatabase() });
    await bootstrap(server);
    const create = await server.inject({
      method: "POST",
      url: "/api/admin/settings/access/admin-roles",
      payload: { name: "content-manager", description: "Content manager" },
    });
    const roleId = create.json().role.id as string;

    const save = await server.inject({
      method: "PUT",
      url: `/api/admin/settings/access/admin-roles/${roleId}/permissions`,
      payload: { permissions: [{ action: "schemas", allowed: true }] },
    });

    expect(create.statusCode).toBe(200);
    expect(create.json().role.roleKind).toBe("admin");
    expect(save.statusCode).toBe(200);
    expect(save.json().permissions).toMatchObject([
      { roleId, action: "schemas", allowed: true },
    ]);
  });

  it("rejects owner permission edits and API roles in admin permissions", async () => {
    const server = createServer({ adminAuth: "disabled", database: openSqliteDatabase() });
    await bootstrap(server);

    const ownerSave = await server.inject({
      method: "PUT",
      url: "/api/admin/settings/access/admin-roles/role_owner/permissions",
      payload: { permissions: [{ action: "settings", allowed: false }] },
    });
    const apiSave = await server.inject({
      method: "PUT",
      url: "/api/admin/settings/access/admin-roles/role_api_reader/permissions",
      payload: { permissions: [{ action: "schemas", allowed: true }] },
    });

    expect(ownerSave.statusCode).toBe(400);
    expect(ownerSave.json()).toEqual({ ok: false, error: "ROLE_OWNER_LOCKED" });
    expect(apiSave.statusCode).toBe(400);
    expect(apiSave.json()).toEqual({ ok: false, error: "ROLE_ADMIN_REQUIRED" });
  });
});

async function bootstrap(server: ReturnType<typeof createServer>): Promise<void> {
  await server.inject({
    method: "POST",
    url: "/api/auth/bootstrap-owner",
    payload: { email: "owner@apiagex.local", password: "OwnerPass123!" },
  });
}
