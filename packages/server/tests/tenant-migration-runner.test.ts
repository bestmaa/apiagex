import { openSqliteAdapter } from "@apiagex/database";
import { describe, expect, it } from "vitest";
import { runTenantMigrations } from "../src/tenant-migration-runner.js";

describe("tenant migration runner", () => {
  it("runs tenant migrations against the tenant database", async () => {
    const db = openSqliteAdapter();

    const result = await runTenantMigrations(db);
    const migration = await db
      .prepare("SELECT id FROM migrations WHERE id = ?")
      .get<{ id: string }>(result.migrationId);
    const schemaTable = await db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
      .get<{ name: string }>("schemas");

    expect(result).toMatchObject({
      migrationId: "001_mvp_foundation",
      provider: "sqlite",
    });
    expect(result.tables).toContain("schemas");
    expect(migration).toEqual({ id: "001_mvp_foundation" });
    expect(schemaTable).toEqual({ name: "schemas" });
    await db.close();
  });

  it("rejects provider mismatches", async () => {
    const db = openSqliteAdapter();

    await expect(runTenantMigrations(db, "postgres")).rejects.toThrow("TENANT_MIGRATION_PROVIDER_MISMATCH");
    await db.close();
  });
});
