import { openSqliteDatabase } from "@apiagex/database";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createServer } from "../src/app.js";

describe("automation token admin APIs", () => {
  it("creates, lists, and revokes automation tokens", async () => {
    const server = createServer({ adminAuth: "disabled", database: openSqliteDatabase() });

    const create = await server.inject({
      method: "POST",
      url: "/api/admin/automation-tokens",
      payload: {
        name: "Codex setup",
        scopes: ["schemas:manage", "workflows:manage"],
        ttlMinutes: 10,
      },
    });

    expect(create.statusCode).toBe(200);
    expect(create.json().token).toMatch(/^agx_auto_/);
    expect(create.json().tokenRecord.tokenPrefix).toBe(create.json().token.slice(0, 16));
    expect(create.json().tokenRecord.scopes).toEqual(["schemas:manage", "workflows:manage"]);
    expect(create.json().tokenRecord.expiresAt).toBeTruthy();

    const list = await server.inject({ method: "GET", url: "/api/admin/automation-tokens" });
    expect(list.statusCode).toBe(200);
    expect(list.json().tokens).toHaveLength(1);
    expect(list.json().tokens[0].name).toBe("Codex setup");
    expect(list.json().tokens[0].token).toBeUndefined();

    const revoke = await server.inject({
      method: "DELETE",
      url: `/api/admin/automation-tokens/${create.json().tokenRecord.id}`,
    });
    expect(revoke.statusCode).toBe(200);
    expect(revoke.json().token.revokedAt).toBeTruthy();
  });

  it("requires owner auth when admin auth is enabled", async () => {
    const server = createServer({ database: openSqliteDatabase() });

    const response = await server.inject({
      method: "GET",
      url: "/api/admin/automation-tokens",
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ ok: false, error: "ADMIN_AUTH_REQUIRED" });
  });

  it("records owner actor metadata when creating through an owner session", async () => {
    const server = createServer({ database: openSqliteDatabase() });
    const login = await server.inject({
      method: "POST",
      url: "/api/auth/bootstrap-owner",
      payload: { email: "owner@apiagex.local", password: "OwnerPass123!" },
    });

    const create = await server.inject({
      method: "POST",
      url: "/api/admin/automation-tokens",
      headers: { authorization: `Bearer ${login.json().token}` },
      payload: { name: "Codex setup" },
    });

    expect(create.statusCode).toBe(200);
    expect(create.json().tokenRecord.createdByEmail).toBe("owner@apiagex.local");
  });

  it("can save the created automation token to the local project env file", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "apiagex-token-env-"));
    const envPath = join(tempDir, ".env");
    try {
      await writeFile(envPath, "APIAGEX_BASE_URL=http://127.0.0.1:4000\nAPIAGEX_AUTOMATION_TOKEN=old\n", "utf8");
      const server = createServer({
        adminAuth: "disabled",
        database: openSqliteDatabase(),
        projectEnvPath: envPath,
      });

      const create = await server.inject({
        method: "POST",
        url: "/api/admin/automation-tokens",
        payload: {
          name: "Codex setup",
          persistToProject: true,
          scopes: ["schemas:manage"],
          ttlMinutes: 10,
        },
      });

      expect(create.statusCode).toBe(200);
      expect(create.json().projectEnv).toEqual({ ok: true, path: envPath });
      expect(await readFile(envPath, "utf8")).toContain(`APIAGEX_AUTOMATION_TOKEN=${create.json().token}\n`);
    } finally {
      await rm(tempDir, { force: true, recursive: true });
    }
  });
});
