import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openSqliteAdapter, openSqliteDatabase } from "@apiagex/database";
import { afterEach, describe, expect, it } from "vitest";
import { createServer } from "../src/app.js";
import { buildTenantHealthDiagnostics } from "../src/tenant-health.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { force: true, recursive: true })));
});

describe("api health route", () => {
  it("returns the API root path catalog", async () => {
    const server = createServer();

    const response = await server.inject({
      method: "GET",
      url: "/api",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      ok: true,
      service: "apiagex",
      paths: ["/api", "/api/openapi.json", "/swagger", "/doc", "/readme", "/adminui", "/uploads"],
    });
  });

  it("returns the Apiagex health payload", async () => {
    const server = createServer();

    const response = await server.inject({
      method: "GET",
      url: "/api/health",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      ok: true,
      service: "apiagex",
      path: "/api/health",
    });
  });

  it("returns safe admin tenant health diagnostics", async () => {
    const uploadsPath = await tempUploadsPath();
    const server = createServer({ adminAuth: "disabled", database: openSqliteDatabase(), uploadsPath });

    const response = await server.inject({
      method: "GET",
      url: "/api/admin/health/tenant",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      ok: true,
      diagnostics: {
        ok: true,
        checks: {
          database: { ok: true, provider: "sqlite", status: "ok" },
          uploads: { configured: true, ok: true, status: "ok" },
        },
        tenant: null,
      },
    });
    expect(response.body).not.toContain("://");
    expect(response.body).not.toContain(uploadsPath);
  });

  it("builds tenant diagnostics without leaking connection secrets", async () => {
    const db = openSqliteAdapter();
    const diagnostics = await buildTenantHealthDiagnostics({
      database: db,
      tenant: {
        databaseProvider: "sqlite",
        id: "tenant_1",
        slug: "pizza-house",
        status: "active",
      },
    });

    expect(diagnostics).toEqual({
      ok: true,
      checks: {
        database: { ok: true, provider: "sqlite", status: "ok" },
        uploads: { configured: false, ok: true, status: "ok" },
      },
      tenant: {
        id: "tenant_1",
        provider: "sqlite",
        slug: "pizza-house",
        status: "active",
      },
    });
    await db.close();
  });

  it.each([
    ["/doc", "Apiagex Docs", "Completed MVP base paths"],
    ["/readme", "Apiagex Readme", "fresh MVP headless CMS/API platform"],
    ["/adminui", "Apiagex Admin UI", "id=\"root\""],
  ])("serves %s from the same server", async (url, heading, detail) => {
    const server = createServer();

    const response = await server.inject({ method: "GET", url });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("text/html");
    expect(response.body).toContain(heading);
    if (detail) {
      expect(response.body).toContain(detail);
    }
  });

  it("serves the React Admin UI shell", async () => {
    const server = createServer();
    const response = await server.inject({ method: "GET", url: "/adminui" });

    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('id="root"');
    expect(response.body).toContain("script");
  });
});

async function tempUploadsPath(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "apiagex-health-"));
  tempDirs.push(dir);
  return dir;
}
