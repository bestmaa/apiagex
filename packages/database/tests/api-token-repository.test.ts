import { describe, expect, it } from "vitest";
import {
  createAdminRole,
  createApiToken,
  createRole,
  listApiTokens,
  migrateMvpDatabase,
  openSqliteDatabase,
  resolveApiToken,
  revokeApiToken,
} from "../src/index.js";

describe("api token repository", () => {
  it("creates hashed API tokens and resolves them to API roles", () => {
    const db = openMigratedDb();
    const role = createRole(db, { name: "reader" });

    const created = createApiToken(db, { roleId: role.id, name: "Docs client" });

    expect(created.token).toMatch(/^agx_/);
    expect(created.tokenRecord.name).toBe("Docs client");
    expect(created.tokenRecord.roleName).toBe("reader");
    expect(listApiTokens(db, role.id)).toHaveLength(1);
    expect(resolveApiToken(db, created.token)?.roleId).toBe(role.id);
    expect(db.prepare("SELECT token_hash FROM api_tokens").get()).not.toEqual({
      token_hash: created.token,
    });
  });

  it("rejects admin roles and revoked tokens", () => {
    const db = openMigratedDb();
    const adminRole = createAdminRole(db, { name: "control-admin" });
    const apiRole = createRole(db, { name: "reader" });

    expect(() => createApiToken(db, { roleId: adminRole.id })).toThrow("ROLE_API_REQUIRED");
    const created = createApiToken(db, { roleId: apiRole.id });
    const revoked = revokeApiToken(db, apiRole.id, created.tokenRecord.id);

    expect(revoked?.revokedAt).toBeTruthy();
    expect(resolveApiToken(db, created.token)).toBeUndefined();
  });
});

function openMigratedDb() {
  const db = openSqliteDatabase();
  migrateMvpDatabase(db);
  return db;
}
