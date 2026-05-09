import { describe, expect, it } from "vitest";
import {
  canRoleAccess,
  createRole,
  createSchema,
  migrateMvpDatabase,
  openSqliteDatabase,
  setPermission,
} from "../src/index.js";

describe("permission repository", () => {
  it("blocks by default and allows checked actions", () => {
    const db = openMigratedDb();
    const role = createRole(db, { name: "editor" });
    const schema = createSchema(db, {
      name: "Article",
      slug: "article",
      fields: [{ name: "Title", slug: "title", type: "text" }],
    });

    expect(canRoleAccess(db, role.id, schema.id, "get")).toBe(false);
    setPermission(db, { roleId: role.id, schemaId: schema.id, action: "get", allowed: true });
    expect(canRoleAccess(db, role.id, schema.id, "get")).toBe(true);
    expect(canRoleAccess(db, role.id, schema.id, "getAll")).toBe(false);
    expect(canRoleAccess(db, role.id, schema.id, "delete")).toBe(false);
  });

  it("keeps list and single get permissions separate", () => {
    const db = openMigratedDb();
    const role = createRole(db, { name: "list-reader" });
    const schema = createSchema(db, {
      name: "Article",
      slug: "article",
      fields: [{ name: "Title", slug: "title", type: "text" }],
    });

    setPermission(db, { roleId: role.id, schemaId: schema.id, action: "getAll", allowed: true });

    expect(canRoleAccess(db, role.id, schema.id, "getAll")).toBe(true);
    expect(canRoleAccess(db, role.id, schema.id, "get")).toBe(false);
  });

  it("lets manage allow all actions for a schema", () => {
    const db = openMigratedDb();
    const role = createRole(db, { name: "manager" });
    const schema = createSchema(db, {
      name: "Article",
      slug: "article",
      fields: [{ name: "Title", slug: "title", type: "text" }],
    });

    setPermission(db, { roleId: role.id, schemaId: schema.id, action: "manage", allowed: true });

    expect(canRoleAccess(db, role.id, schema.id, "getAll")).toBe(true);
    expect(canRoleAccess(db, role.id, schema.id, "get")).toBe(true);
    expect(canRoleAccess(db, role.id, schema.id, "create")).toBe(true);
    expect(canRoleAccess(db, role.id, schema.id, "delete")).toBe(true);
  });

  it("blocks admin roles from content API permissions", () => {
    const db = openMigratedDb();
    const now = new Date().toISOString();
    db.prepare(
      "INSERT INTO roles (id, name, description, is_owner, role_kind, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ).run("owner-role", "owner", "Owner", 1, "admin", now, now);
    const schema = createSchema(db, {
      name: "Article",
      slug: "article",
      fields: [{ name: "Title", slug: "title", type: "text" }],
    });

    expect(canRoleAccess(db, "owner-role", schema.id, "delete")).toBe(false);
    expect(() =>
      setPermission(db, {
        roleId: "owner-role",
        schemaId: schema.id,
        action: "manage",
        allowed: true,
      }),
    ).toThrow("ROLE_API_REQUIRED");
  });
});

function openMigratedDb() {
  const db = openSqliteDatabase();
  migrateMvpDatabase(db);
  return db;
}
