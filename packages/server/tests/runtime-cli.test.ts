import { describe, expect, it, vi } from "vitest";
import type { AddressInfo } from "node:net";
import { mkdir, mkdtemp, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runRuntimeCli, startApiagex } from "../src/runtime.js";
import { createSchema, openMigratedSqliteAdapter } from "@apiagex/database";

describe("apiagex runtime CLI", () => {
  it("prints help", async () => {
    const result = await runRuntimeCli(["--help"]);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain("apiagex dev");
    expect(result.stdout).toContain("APIAGEX_DATABASE_PROVIDER");
    expect(result.stdout).toContain("sqlite, postgres, or mysql");
    expect(result.stdout).toContain("APIAGEX_DATABASE_PATH");
    expect(result.stdout).toContain("APIAGEX_DATABASE_URL");
    expect(result.stdout).toContain("APIAGEX_OWNER_PASSWORD");
  });

  it("prints version", async () => {
    const result = await runRuntimeCli(["--version"]);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain("apiagex 0.8.15");
  });

  it("runs a health smoke check without a long-running server", async () => {
    const result = await runRuntimeCli(["smoke"], { cwd: "/tmp/generated-apiagex" });

    expect(result.code).toBe(0);
    expect(result.stdout).toContain("Apiagex smoke passed");
    expect(result.stdout).toContain("/tmp/generated-apiagex");
  });

  it("returns guidance for generated project build scripts", async () => {
    const result = await runRuntimeCli(["build"]);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain("does not need a project build");
  });

  it("generates TypeScript schema helpers from the runtime database", async () => {
    const root = await mkdtemp(join(tmpdir(), "apiagex-runtime-types-"));
    await mkdir(join(root, "data"));
    const databasePath = join(root, "data/runtime.sqlite");
    const database = openMigratedSqliteAdapter(databasePath);
    await createSchema(database, {
      name: "Products",
      slug: "products",
      fields: [
        { name: "Name", slug: "name", type: "text", required: true },
        { name: "Price", slug: "price", type: "number", required: true },
        { name: "Published", slug: "published", type: "boolean" },
      ],
    });
    await database.close();

    const result = await runRuntimeCli(["types"], {
      cwd: root,
      env: {
        APIAGEX_DATABASE_PATH: "data/runtime.sqlite",
        APIAGEX_UPLOADS_PATH: "uploads",
      },
    });

    expect(result.code).toBe(0);
    expect(result.stdout).toContain("Generated 1 schema type");
    const generated = await readFile(join(root, "src/apiagex-types.ts"), "utf8");
    expect(generated).toContain('"products"');
    expect(generated).toContain("export type ProductsData");
    expect(generated).toContain("name: string;");
    expect(generated).toContain("price: number;");
    expect(generated).toContain("published?: boolean | null;");
    expect(generated).toContain('declare module "@apiagex/server"');
    expect(generated).toContain("interface ApiagexProjectTypes");
    expect(generated).toContain("schemas: ApiagexEntryDataBySlug;");
  });

  it("rejects unknown commands", async () => {
    const result = await runRuntimeCli(["publish"]);

    expect(result.code).toBe(1);
    expect(result.stderr).toContain("Unknown apiagex command: publish");
  });

  it("can bootstrap the first owner during server start", async () => {
    const root = await mkdtemp(join(tmpdir(), "apiagex-runtime-"));
    const server = await startApiagex({
      cwd: root,
      env: {
        APIAGEX_DATABASE_PATH: "data/runtime.sqlite",
        APIAGEX_UPLOADS_PATH: "uploads",
      },
      host: "127.0.0.1",
      port: 0,
      initialOwner: { email: "owner@example.com", password: "OwnerPass123!" },
    });

    expect(server).toBeTruthy();
    const port = (server?.server.address() as AddressInfo).port;
    const login = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      body: JSON.stringify({ email: "owner@example.com", password: "OwnerPass123!" }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    expect(login.status).toBe(200);
    await server?.close();
  }, 15_000);

  it("prints a visible startup error when the port is already in use", async () => {
    const firstRoot = await mkdtemp(join(tmpdir(), "apiagex-runtime-port-first-"));
    const secondRoot = await mkdtemp(join(tmpdir(), "apiagex-runtime-port-second-"));
    const server = await startApiagex({
      cwd: firstRoot,
      env: {
        APIAGEX_DATABASE_PATH: "data/runtime.sqlite",
        APIAGEX_UPLOADS_PATH: "uploads",
      },
      host: "127.0.0.1",
      port: 0,
    });
    const port = (server?.server.address() as AddressInfo).port;
    const previousExitCode = process.exitCode;
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    try {
      const blocked = await startApiagex({
        cwd: secondRoot,
        env: {
          APIAGEX_DATABASE_PATH: "data/runtime.sqlite",
          APIAGEX_UPLOADS_PATH: "uploads",
        },
        host: "127.0.0.1",
        port,
      });

      expect(blocked).toBeUndefined();
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining(`http://127.0.0.1:${port} is already in use`),
      );
    } finally {
      process.exitCode = previousExitCode;
      errorSpy.mockRestore();
      await server?.close();
    }
  }, 15_000);
});
