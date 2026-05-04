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

    expect(canRoleAccess(db, role.id, schema.id, "read")).toBe(false);
    setPermission(db, { roleId: role.id, schemaId: schema.id, action: "read", allowed: true });
    expect(canRoleAccess(db, role.id, schema.id, "read")).toBe(true);
    expect(canRoleAccess(db, role.id, schema.id, "delete")).toBe(false);
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

    expect(canRoleAccess(db, role.id, schema.id, "create")).toBe(true);
    expect(canRoleAccess(db, role.id, schema.id, "delete")).toBe(true);
  });

  it("always allows owner roles", () => {
    const db = openMigratedDb();
    const now = new Date().toISOString();
    db.prepare(
      "INSERT INTO roles (id, name, description, is_owner, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
    ).run("owner-role", "owner", "Owner", 1, now, now);
    const schema = createSchema(db, {
      name: "Article",
      slug: "article",
      fields: [{ name: "Title", slug: "title", type: "text" }],
    });

    expect(canRoleAccess(db, "owner-role", schema.id, "delete")).toBe(true);
  });
});

function openMigratedDb() {
  const db = openSqliteDatabase();
  migrateMvpDatabase(db);
  return db;
}
