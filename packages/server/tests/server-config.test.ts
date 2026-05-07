import { access, mkdtemp } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { createServer } from "../src/app.js";
import {
  ensureLocalServerPaths,
  resolveLocalServerConfig,
} from "../src/server-config.js";

describe("local server configuration", () => {
  it("resolves documented local persistence defaults", () => {
    const config = resolveLocalServerConfig({}, "/workspace/app");

    expect(config.databasePath).toBe("/workspace/app/.apiagex/apiagex.sqlite");
    expect(config.uploadsPath).toBe("/workspace/app/.apiagex/uploads");
  });

  it("allows env overrides for database and uploads paths", () => {
    const config = resolveLocalServerConfig(
      {
        APIAGEX_DATABASE_PATH: "data/local.sqlite",
        APIAGEX_UPLOADS_PATH: "storage/uploads",
      },
      "/workspace/app",
    );

    expect(config.databasePath).toBe("/workspace/app/data/local.sqlite");
    expect(config.uploadsPath).toBe("/workspace/app/storage/uploads");
  });

  it("uses npm INIT_CWD for workspace dev persistence defaults", () => {
    const config = resolveLocalServerConfig(
      { INIT_CWD: "/workspace/app" },
      "/workspace/app/packages/server",
    );

    expect(config.databasePath).toBe("/workspace/app/.apiagex/apiagex.sqlite");
    expect(config.uploadsPath).toBe("/workspace/app/.apiagex/uploads");
  });

  it("creates local persistence directories only when explicitly requested", async () => {
    const root = await mkdtemp(join(tmpdir(), "apiagex-config-"));
    const config = resolveLocalServerConfig({}, root);

    await ensureLocalServerPaths(config);

    await expect(access(join(root, ".apiagex"))).resolves.toBeUndefined();
    await expect(access(config.uploadsPath)).resolves.toBeUndefined();
  });

  it("keeps createServer default isolated with an in-memory database", async () => {
    const server = createServer();
    const response = await server.inject({ method: "GET", url: "/api/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      ok: true,
      service: "apiagex",
      path: "/api/health",
    });
  });
});
