import { describe, expect, it } from "vitest";
import {
  createAdminRole,
  createRole,
  listAdminRoles,
  listRoles,
  openMigratedSqliteAdapter,
} from "../src/index.js";

describe("role repository", () => {
  it("creates unlimited non-owner roles", async () => {
    const db = openMigratedSqliteAdapter();

    const editor = await createRole(db, { name: "editor", description: "Can edit" });
    const viewer = await createRole(db, { name: "viewer" });

    expect(editor.name).toBe("editor");
    expect(viewer.isOwner).toBe(false);
    expect(viewer.roleKind).toBe("api");
    expect((await listRoles(db)).map((role) => role.name)).toEqual(["editor", "viewer"]);
  });

  it("validates role names and reserves admin role names", async () => {
    const db = openMigratedSqliteAdapter();

    await expect(createRole(db, { name: "Bad Role" })).rejects.toThrow("ROLE_NAME_INVALID");
    await expect(createRole(db, { name: "owner" })).rejects.toThrow("ROLE_OWNER_RESERVED");
    await expect(createRole(db, { name: "admin" })).rejects.toThrow("ROLE_ADMIN_RESERVED");
    await expect(createRole(db, { name: "schema-manager" })).rejects.toThrow("ROLE_ADMIN_RESERVED");
    await expect(createRole(db, { name: "user-manager" })).rejects.toThrow("ROLE_ADMIN_RESERVED");
  });

  it("lists API roles only", async () => {
    const db = openMigratedSqliteAdapter();
    const now = new Date().toISOString();
    await db.prepare(
      "INSERT INTO roles (id, name, description, is_owner, role_kind, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ).run("role_admin", "admin", "Admin", 0, "admin", now, now);

    await createRole(db, { name: "reader" });

    expect((await listRoles(db)).map((role) => role.name)).toEqual(["reader"]);
  });

  it("creates and lists admin roles separately", async () => {
    const db = openMigratedSqliteAdapter();
    const adminRole = await createAdminRole(db, { name: "content-manager" });
    await createRole(db, { name: "reader" });

    expect(adminRole.roleKind).toBe("admin");
    expect((await listAdminRoles(db)).map((role) => role.name)).toEqual(["content-manager"]);
    expect((await listRoles(db)).map((role) => role.name)).toEqual(["reader"]);
  });
});
