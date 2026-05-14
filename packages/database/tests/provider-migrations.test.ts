import { describe, expect, it } from "vitest";
import {
  getProviderFoundationMigration,
  MVP_FOUNDATION_SQL,
  MVP_TABLES,
  providerFoundationSql,
} from "../src/index.js";

describe("provider migration SQL", () => {
  it("keeps SQLite foundation SQL exactly as the current better-sqlite3 path", () => {
    expect(providerFoundationSql("sqlite")).toBe(MVP_FOUNDATION_SQL);
    expect(getProviderFoundationMigration("sqlite").tables).toEqual(MVP_TABLES);
  });

  it("generates PostgreSQL foundation SQL with Postgres-native sequence and booleans", () => {
    const sql = providerFoundationSql("postgres");

    expect(sql).toContain("CREATE TABLE IF NOT EXISTS migrations");
    expect(sql).toContain("sequence BIGSERIAL PRIMARY KEY");
    expect(sql).toContain("is_owner BOOLEAN NOT NULL DEFAULT FALSE");
    expect(sql).toContain("REFERENCES schemas(id) ON DELETE CASCADE");
    expect(sql).not.toContain("AUTOINCREMENT");
  });

  it("generates MySQL foundation SQL with InnoDB, auto increment, and long text JSON columns", () => {
    const sql = providerFoundationSql("mysql");

    expect(sql).toContain("ENGINE=InnoDB");
    expect(sql).toContain("sequence BIGINT AUTO_INCREMENT PRIMARY KEY");
    expect(sql).toContain("active TINYINT(1) NOT NULL DEFAULT 1");
    expect(sql).toContain("payload_json LONGTEXT NOT NULL");
    expect(sql).toContain("FOREIGN KEY (schema_id) REFERENCES schemas(id) ON DELETE CASCADE");
    expect(sql).not.toContain("AUTOINCREMENT");
  });
});
