import { openSqliteAdapter } from "@apiagex/database";
import { describe, expect, it } from "vitest";
import { bootstrapTenantOwner } from "../src/tenant-owner-bootstrap.js";
import { runTenantMigrations } from "../src/tenant-migration-runner.js";

describe("tenant owner bootstrap", () => {
  it("bootstraps a first tenant owner without returning tokens or passwords", async () => {
    const db = openSqliteAdapter();
    await runTenantMigrations(db);

    const result = await bootstrapTenantOwner(db, {
      email: "OWNER@EXAMPLE.COM",
      password: "password-123",
    });
    const owner = await db
      .prepare("SELECT email FROM users WHERE email = ?")
      .get<{ email: string }>("owner@example.com");

    expect(result).toMatchObject({
      created: true,
      email: "owner@example.com",
    });
    expect(JSON.stringify(result)).not.toContain("password-123");
    expect(JSON.stringify(result)).not.toContain("owner:");
    expect(owner).toEqual({ email: "owner@example.com" });
    await db.close();
  });

  it("skips bootstrap when owner input or password is missing", async () => {
    const db = openSqliteAdapter();

    await expect(bootstrapTenantOwner(db, undefined)).resolves.toEqual({
      created: false,
      reason: "OWNER_INPUT_MISSING",
    });
    await expect(bootstrapTenantOwner(db, { email: "owner@example.com" })).resolves.toEqual({
      created: false,
      reason: "OWNER_PASSWORD_MISSING",
    });
    await db.close();
  });
});
