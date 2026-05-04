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
});
