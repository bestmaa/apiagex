import { describe, expect, it } from "vitest";
import {
  canRoleAccess,
  createRole,
  createSchema,
  openMigratedSqliteAdapter,
  setPermission,
} from "../src/index.js";

describe("permission repository", () => {
  it("blocks by default and allows checked actions", async () => {
    const db = openMigratedSqliteAdapter();
    const role = await createRole(db, { name: "editor" });
    const schema = await createSchema(db, {
      name: "Article",
      slug: "article",
      fields: [{ name: "Title", slug: "title", type: "text" }],
    });

    expect(await canRoleAccess(db, role.id, schema.id, "get")).toBe(false);
    await setPermission(db, { roleId: role.id, schemaId: schema.id, action: "get", allowed: true });
    expect(await canRoleAccess(db, role.id, schema.id, "get")).toBe(true);
    expect(await canRoleAccess(db, role.id, schema.id, "getAll")).toBe(false);
    expect(await canRoleAccess(db, role.id, schema.id, "delete")).toBe(false);
  });

  it("keeps list and single get permissions separate", async () => {
    const db = openMigratedSqliteAdapter();
    const role = await createRole(db, { name: "list-reader" });
    const schema = await createSchema(db, {
      name: "Article",
      slug: "article",
      fields: [{ name: "Title", slug: "title", type: "text" }],
    });

    await setPermission(db, { roleId: role.id, schemaId: schema.id, action: "getAll", allowed: true });

    expect(await canRoleAccess(db, role.id, schema.id, "getAll")).toBe(true);
    expect(await canRoleAccess(db, role.id, schema.id, "get")).toBe(false);
  });

  it("lets manage allow all actions for a schema", async () => {
    const db = openMigratedSqliteAdapter();
    const role = await createRole(db, { name: "manager" });
    const schema = await createSchema(db, {
      name: "Article",
      slug: "article",
      fields: [{ name: "Title", slug: "title", type: "text" }],
    });

    await setPermission(db, { roleId: role.id, schemaId: schema.id, action: "manage", allowed: true });

    expect(await canRoleAccess(db, role.id, schema.id, "getAll")).toBe(true);
    expect(await canRoleAccess(db, role.id, schema.id, "get")).toBe(true);
    expect(await canRoleAccess(db, role.id, schema.id, "create")).toBe(true);
    expect(await canRoleAccess(db, role.id, schema.id, "delete")).toBe(true);
  });

  it("blocks admin roles from content API permissions", async () => {
    const db = openMigratedSqliteAdapter();
    const now = new Date().toISOString();
    await db.prepare(
      "INSERT INTO roles (id, name, description, is_owner, role_kind, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ).run("owner-role", "owner", "Owner", 1, "admin", now, now);
    const schema = await createSchema(db, {
      name: "Article",
      slug: "article",
      fields: [{ name: "Title", slug: "title", type: "text" }],
    });

    expect(await canRoleAccess(db, "owner-role", schema.id, "delete")).toBe(false);
    await expect(
      setPermission(db, {
        roleId: "owner-role",
        schemaId: schema.id,
        action: "manage",
        allowed: true,
      }),
    ).rejects.toThrow("ROLE_API_REQUIRED");
  });
});
