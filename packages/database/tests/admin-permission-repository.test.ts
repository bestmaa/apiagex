import { describe, expect, it } from "vitest";
import {
  canAdminRoleAccess,
  createAdminRole,
  createRole,
  listAdminRolePermissions,
  migrateMvpDatabase,
  openSqliteDatabase,
  setAdminPermission,
} from "../src/index.js";

describe("admin permission repository", () => {
  it("allows saved admin permissions for admin roles", () => {
    const db = openMigratedDb();
    const role = createAdminRole(db, { name: "schema-admin" });

    expect(canAdminRoleAccess(db, role.id, "schemas")).toBe(false);
    setAdminPermission(db, { roleId: role.id, action: "schemas", allowed: true });

    expect(canAdminRoleAccess(db, role.id, "schemas")).toBe(true);
    expect(canAdminRoleAccess(db, role.id, "settings")).toBe(false);
    expect(listAdminRolePermissions(db, role.id)).toHaveLength(1);
  });

  it("rejects API roles and invalid admin actions", () => {
    const db = openMigratedDb();
    const role = createRole(db, { name: "reader" });

    expect(() =>
      setAdminPermission(db, { roleId: role.id, action: "schemas", allowed: true }),
    ).toThrow("ROLE_ADMIN_REQUIRED");
    expect(() =>
      setAdminPermission(db, {
        roleId: role.id,
        action: "missing" as "schemas",
        allowed: true,
      }),
    ).toThrow("ADMIN_PERMISSION_ACTION_INVALID");
  });

  it("treats owner as locked with all admin permissions", () => {
    const db = openMigratedDb();
    const now = new Date().toISOString();
    db.prepare(
      "INSERT INTO roles (id, name, description, is_owner, role_kind, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ).run("role_owner", "owner", "Owner", 1, "admin", now, now);

    expect(canAdminRoleAccess(db, "role_owner", "settings")).toBe(true);
    expect(listAdminRolePermissions(db, "role_owner").every((permission) => permission.allowed)).toBe(true);
    expect(() =>
      setAdminPermission(db, { roleId: "role_owner", action: "settings", allowed: false }),
    ).toThrow("ROLE_OWNER_LOCKED");
  });
});

function openMigratedDb() {
  const db = openSqliteDatabase();
  migrateMvpDatabase(db);
  return db;
}
