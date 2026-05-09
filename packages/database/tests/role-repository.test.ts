import { describe, expect, it } from "vitest";
import {
  createAdminRole,
  createRole,
  listAdminRoles,
  listRoles,
  migrateMvpDatabase,
  openSqliteDatabase,
} from "../src/index.js";

describe("role repository", () => {
  it("creates unlimited non-owner roles", () => {
    const db = openMigratedDb();

    const editor = createRole(db, { name: "editor", description: "Can edit" });
    const viewer = createRole(db, { name: "viewer" });

    expect(editor.name).toBe("editor");
    expect(viewer.isOwner).toBe(false);
    expect(viewer.roleKind).toBe("api");
    expect(listRoles(db).map((role) => role.name)).toEqual(["editor", "viewer"]);
  });

  it("validates role names and reserves admin role names", () => {
    const db = openMigratedDb();

    expect(() => createRole(db, { name: "Bad Role" })).toThrow("ROLE_NAME_INVALID");
    expect(() => createRole(db, { name: "owner" })).toThrow("ROLE_OWNER_RESERVED");
    expect(() => createRole(db, { name: "admin" })).toThrow("ROLE_ADMIN_RESERVED");
    expect(() => createRole(db, { name: "schema-manager" })).toThrow("ROLE_ADMIN_RESERVED");
    expect(() => createRole(db, { name: "user-manager" })).toThrow("ROLE_ADMIN_RESERVED");
  });

  it("lists API roles only", () => {
    const db = openMigratedDb();
    const now = new Date().toISOString();
    db.prepare(
      "INSERT INTO roles (id, name, description, is_owner, role_kind, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ).run("role_admin", "admin", "Admin", 0, "admin", now, now);

    createRole(db, { name: "reader" });

    expect(listRoles(db).map((role) => role.name)).toEqual(["reader"]);
  });

  it("creates and lists admin roles separately", () => {
    const db = openMigratedDb();
    const adminRole = createAdminRole(db, { name: "content-manager" });
    createRole(db, { name: "reader" });

    expect(adminRole.roleKind).toBe("admin");
    expect(listAdminRoles(db).map((role) => role.name)).toEqual(["content-manager"]);
    expect(listRoles(db).map((role) => role.name)).toEqual(["reader"]);
  });
});

function openMigratedDb() {
  const db = openSqliteDatabase();
  migrateMvpDatabase(db);
  return db;
}
