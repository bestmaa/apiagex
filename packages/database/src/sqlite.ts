import Database from "better-sqlite3";
import {
  MVP_FOUNDATION_SQL,
  MVP_MIGRATION_ID,
  MVP_TABLES,
} from "./migrations.js";
import type { MigrationRecord, TableInfoRow } from "./schema.type.js";

export type SqliteDatabase = Database.Database;

export function openSqliteDatabase(path = ":memory:"): SqliteDatabase {
  const db = new Database(path);
  db.pragma("foreign_keys = ON");
  return db;
}

export function migrateMvpDatabase(db: SqliteDatabase): void {
  db.exec(MVP_FOUNDATION_SQL);
  const existing = db
    .prepare("SELECT id, applied_at FROM migrations WHERE id = ?")
    .get(MVP_MIGRATION_ID) as MigrationRecord | undefined;

  if (!existing) {
    db.prepare("INSERT INTO migrations (id, applied_at) VALUES (?, ?)").run(
      MVP_MIGRATION_ID,
      new Date().toISOString(),
    );
  }
}

export function listMvpTables(db: SqliteDatabase): string[] {
  const rows = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
    .all() as TableInfoRow[];

  return rows
    .map((row) => row.name)
    .filter((name) => MVP_TABLES.includes(name as (typeof MVP_TABLES)[number]));
}
