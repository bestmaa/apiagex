import { describe, expect, it } from "vitest";
import {
  createAutomationToken,
  listAutomationTokens,
  openMigratedSqliteAdapter,
  resolveAutomationToken,
  revokeAutomationToken,
} from "../src/index.js";

describe("automation token repository", () => {
  it("creates hashed temporary automation tokens and resolves scoped access", async () => {
    const db = openMigratedSqliteAdapter();

    const created = await createAutomationToken(db, {
      name: "Codex setup",
      scopes: ["schemas:manage", "workflows:manage"],
      ttlMinutes: 5,
      createdById: "owner_1",
      createdByEmail: "owner@apiagex.local",
    });

    expect(created.token).toMatch(/^agx_auto_/);
    expect(created.tokenRecord.name).toBe("Codex setup");
    expect(created.tokenRecord.tokenPrefix).toBe(created.token.slice(0, 16));
    expect(created.tokenRecord.scopes).toEqual(["schemas:manage", "workflows:manage"]);
    expect(created.tokenRecord.createdByEmail).toBe("owner@apiagex.local");
    expect((await listAutomationTokens(db))[0]?.tokenPrefix).toBe(created.token.slice(0, 16));
    expect((await listAutomationTokens(db))[0]).not.toHaveProperty("token");
    expect((await resolveAutomationToken(db, created.token, ["schemas:manage"]))?.tokenRecord.id).toBe(
      created.tokenRecord.id,
    );
    expect(await db.prepare("SELECT token_hash FROM automation_tokens").get()).not.toEqual({
      token_hash: created.token,
    });
    expect((await listAutomationTokens(db))[0]?.lastUsedAt).toBeTruthy();
  });

  it("rejects invalid scopes, expired tokens, and revoked tokens", async () => {
    const db = openMigratedSqliteAdapter();

    await expect(
      createAutomationToken(db, { scopes: ["content:read" as "schemas:manage"] }),
    ).rejects.toThrow("AUTOMATION_TOKEN_SCOPE_INVALID");

    const limited = await createAutomationToken(db, { scopes: ["routes:read"] });
    expect(await resolveAutomationToken(db, limited.token, ["schemas:manage"])).toBeUndefined();

    await db
      .prepare("UPDATE automation_tokens SET expires_at = ? WHERE id = ?")
      .run(new Date(Date.now() - 60_000).toISOString(), limited.tokenRecord.id);
    expect(await resolveAutomationToken(db, limited.token, ["routes:read"])).toBeUndefined();

    const active = await createAutomationToken(db, { scopes: ["plans:apply"] });
    const revoked = await revokeAutomationToken(db, active.tokenRecord.id);

    expect(revoked?.revokedAt).toBeTruthy();
    expect(await resolveAutomationToken(db, active.token, ["plans:apply"])).toBeUndefined();
  });
});
