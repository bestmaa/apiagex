import { describe, expect, it } from "vitest";
import {
  canAdminRoleAccess,
  createAdminRole,
  createRole,
  listAdminRolePermissions,
  openMigratedSqliteAdapter,
  setAdminPermission,
} from "../src/index.js";

describe("admin permission repository", () => {
  it("allows saved admin permissions for admin roles", async () => {
    const db = openMigratedSqliteAdapter();
    const role = await createAdminRole(db, { name: "schema-admin" });

    expect(await canAdminRoleAccess(db, role.id, "schemas")).toBe(false);
    await setAdminPermission(db, { roleId: role.id, action: "schemas", allowed: true });

    expect(await canAdminRoleAccess(db, role.id, "schemas")).toBe(true);
    expect(await canAdminRoleAccess(db, role.id, "settings")).toBe(false);
    expect(await listAdminRolePermissions(db, role.id)).toHaveLength(1);
  });

  it("rejects API roles and invalid admin actions", async () => {
    const db = openMigratedSqliteAdapter();
    const role = await createRole(db, { name: "reader" });

    await expect(
      setAdminPermission(db, { roleId: role.id, action: "schemas", allowed: true }),
    ).rejects.toThrow("ROLE_ADMIN_REQUIRED");
    await expect(
      setAdminPermission(db, {
        roleId: role.id,
        action: "missing" as "schemas",
        allowed: true,
      }),
    ).rejects.toThrow("ADMIN_PERMISSION_ACTION_INVALID");
  });

  it("treats owner as locked with all admin permissions", async () => {
    const db = openMigratedSqliteAdapter();
    const now = new Date().toISOString();
    await db.prepare(
      "INSERT INTO roles (id, name, description, is_owner, role_kind, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ).run("role_owner", "owner", "Owner", 1, "admin", now, now);

    expect(await canAdminRoleAccess(db, "role_owner", "settings")).toBe(true);
    expect((await listAdminRolePermissions(db, "role_owner")).every((permission) => permission.allowed)).toBe(true);
    await expect(
      setAdminPermission(db, { roleId: "role_owner", action: "settings", allowed: false }),
    ).rejects.toThrow("ROLE_OWNER_LOCKED");
  });
});
