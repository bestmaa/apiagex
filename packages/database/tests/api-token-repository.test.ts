import { describe, expect, it } from "vitest";
import {
  createAdminRole,
  createApiToken,
  createRole,
  listApiTokens,
  openMigratedSqliteAdapter,
  resolveApiToken,
  revokeApiToken,
} from "../src/index.js";

describe("api token repository", () => {
  it("creates hashed API tokens and resolves them to API roles", async () => {
    const db = openMigratedSqliteAdapter();
    const role = await createRole(db, { name: "reader" });

    const created = await createApiToken(db, { roleId: role.id, name: "Docs client" });

    expect(created.token).toMatch(/^agx_/);
    expect(created.tokenRecord.name).toBe("Docs client");
    expect(created.tokenRecord.roleName).toBe("reader");
    expect(await listApiTokens(db, role.id)).toHaveLength(1);
    expect((await resolveApiToken(db, created.token))?.roleId).toBe(role.id);
    expect(await db.prepare("SELECT token_hash FROM api_tokens").get()).not.toEqual({
      token_hash: created.token,
    });
  });

  it("rejects admin roles and revoked tokens", async () => {
    const db = openMigratedSqliteAdapter();
    const adminRole = await createAdminRole(db, { name: "control-admin" });
    const apiRole = await createRole(db, { name: "reader" });

    await expect(createApiToken(db, { roleId: adminRole.id })).rejects.toThrow("ROLE_API_REQUIRED");
    const created = await createApiToken(db, { roleId: apiRole.id });
    const revoked = await revokeApiToken(db, apiRole.id, created.tokenRecord.id);

    expect(revoked?.revokedAt).toBeTruthy();
    expect(await resolveApiToken(db, created.token)).toBeUndefined();
  });
});
