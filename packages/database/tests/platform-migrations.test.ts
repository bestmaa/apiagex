import { describe, expect, it } from "vitest";
import {
  migratePlatformDatabase,
  openPlatformDatabase,
  PLATFORM_MIGRATION_ID,
  PLATFORM_TABLES,
  platformFoundationSql,
} from "../src/index.js";

describe("platform migrations", () => {
  it("creates platform tenant registry tables and records migration", async () => {
    const db = await openPlatformDatabase({ provider: "sqlite", url: ":memory:" });
    try {
      await migratePlatformDatabase(db);

      await expect(listSqliteTables(db)).resolves.toEqual([...PLATFORM_TABLES].sort());
      await expect(db.prepare("SELECT id FROM platform_migrations WHERE id = ?").get<{ id: string }>(PLATFORM_MIGRATION_ID))
        .resolves.toEqual({ id: PLATFORM_MIGRATION_ID });
      await expect(db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'roles'").get())
        .resolves.toBeUndefined();
    } finally {
      await db.close();
    }
  });

  it("can run platform migrations repeatedly", async () => {
    const db = await openPlatformDatabase({ provider: "sqlite", url: ":memory:" });
    try {
      await migratePlatformDatabase(db);
      await migratePlatformDatabase(db);

      await expect(db.prepare("SELECT COUNT(*) as count FROM platform_migrations").get<{ count: number }>())
        .resolves.toEqual({ count: 1 });
    } finally {
      await db.close();
    }
  });

  it("generates provider-specific platform foundation SQL", () => {
    expect(platformFoundationSql("sqlite")).toContain("CREATE TABLE IF NOT EXISTS tenants");
    expect(platformFoundationSql("postgres")).toContain("REFERENCES tenants(id) ON DELETE CASCADE");
    expect(platformFoundationSql("mysql")).toContain("ENGINE=InnoDB");
    expect(platformFoundationSql("mysql")).toContain("database_url_encrypted_json LONGTEXT NOT NULL");
  });
});

async function listSqliteTables(db: Awaited<ReturnType<typeof openPlatformDatabase>>): Promise<string[]> {
  const rows = await db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
    .all<{ name: string }>();
  return rows.map((row) => row.name).filter((name) => (PLATFORM_TABLES as readonly string[]).includes(name));
}
