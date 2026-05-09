import { describe, expect, it } from "vitest";
import {
  listMvpTables,
  migrateMvpDatabase,
  MVP_MIGRATION_ID,
  MVP_TABLES,
  openSqliteDatabase,
} from "../src/index.js";

describe("MVP database foundation", () => {
  it("creates the MVP tables and records the migration", () => {
    const db = openSqliteDatabase();

    migrateMvpDatabase(db);

    expect(listMvpTables(db)).toEqual([...MVP_TABLES].sort());
    const migration = db
      .prepare("SELECT id FROM migrations WHERE id = ?")
      .get(MVP_MIGRATION_ID);
    expect(migration).toEqual({ id: MVP_MIGRATION_ID });
  });

  it("can run the migration repeatedly", () => {
    const db = openSqliteDatabase();

    migrateMvpDatabase(db);
    migrateMvpDatabase(db);

    const count = db.prepare("SELECT COUNT(*) as count FROM migrations").get();
    expect(count).toEqual({ count: 1 });
  });

  it("adds relation type metadata to fields", () => {
    const db = openSqliteDatabase();

    migrateMvpDatabase(db);

    const fieldColumns = db.prepare("PRAGMA table_info(fields)").all() as Array<{
      name: string;
    }>;
    expect(fieldColumns.map((column) => column.name)).toContain("relation_type");
  });

  it("adds role kind metadata to roles", () => {
    const db = openSqliteDatabase();

    migrateMvpDatabase(db);

    const roleColumns = db.prepare("PRAGMA table_info(roles)").all() as Array<{
      name: string;
    }>;
    expect(roleColumns.map((column) => column.name)).toContain("role_kind");
  });

  it("adds admin permissions for control-plane roles", () => {
    const db = openSqliteDatabase();

    migrateMvpDatabase(db);

    const adminPermissionColumns = db.prepare("PRAGMA table_info(admin_permissions)").all() as Array<{
      name: string;
    }>;
    expect(adminPermissionColumns.map((column) => column.name)).toContain("action");
  });

  it("seeds existing admin role permissions during additive migration", () => {
    const db = openSqliteDatabase();
    const now = new Date().toISOString();
    db.exec(`CREATE TABLE roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL DEFAULT '',
      is_owner INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`);
    db.prepare(
      "INSERT INTO roles (id, name, description, is_owner, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
    ).run("role_admin", "admin", "Admin", 0, now, now);

    migrateMvpDatabase(db);

    const actions = db
      .prepare("SELECT action FROM admin_permissions WHERE role_id = ? ORDER BY action")
      .all("role_admin") as Array<{ action: string }>;
    expect(actions.map((row) => row.action)).toEqual([
      "apiRoles",
      "apiUsers",
      "entries",
      "schemas",
      "settings",
    ]);
  });
});
