import { mkdir, mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  openMigratedSqliteAdapter,
  type ApiagexDatabase,
  type TenantRecord,
} from "@apiagex/database";
import { afterEach, describe, expect, it } from "vitest";
import { createServer } from "../src/app.js";
import { tenantLookupFromRecords } from "../src/tenant-context.js";

const tempDirs: string[] = [];
const tenantRuntimeTimeoutMs = 15_000;

describe("tenant-aware runtime", () => {
  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { force: true, recursive: true })));
  });

  it("routes tenant admin APIs to the resolved tenant database", async () => {
    const { dbBySlug, tenants } = await tenantFixture();
    const server = createServer({
      adminAuth: "disabled",
      database: openMigratedSqliteAdapter(),
      multiTenant: {
        enabled: true,
        getTenantDatabase: async (tenant) => dbBySlug[tenant.slug],
        getTenantUploadsPath: (tenant) => tenant.uploadsPath,
        lookupTenant: tenantLookupFromRecords(tenants),
        resolver: { rootDomain: "example.test" },
        skipPaths: ["/api/platform", "/api/health"],
      },
    });

    const pizzaCreate = await server.inject({
      headers: { host: "pizza.example.test" },
      method: "POST",
      payload: {
        name: "Menu Item",
        slug: "menu-items",
        fields: [{ name: "Title", slug: "title", type: "text", required: true }],
      },
      url: "/api/admin/schemas",
    });
    const burgerList = await server.inject({
      headers: { host: "burger.example.test" },
      method: "GET",
      url: "/api/admin/schemas",
    });
    const pizzaList = await server.inject({
      headers: { host: "pizza.example.test" },
      method: "GET",
      url: "/api/admin/schemas",
    });

    expect(pizzaCreate.statusCode).toBe(200);
    expect(burgerList.json().schemas).toEqual([]);
    expect(pizzaList.json().schemas).toHaveLength(1);
    expect(pizzaList.json().schemas[0]).toMatchObject({ slug: "menu-items" });

    await server.close();
    await Promise.all(Object.values(dbBySlug).map((db) => db.close()));
  }, tenantRuntimeTimeoutMs);

  it("routes content APIs to the resolved tenant database", async () => {
    const { dbBySlug, tenants } = await tenantFixture();
    const server = createServer({
      adminAuth: "disabled",
      database: openMigratedSqliteAdapter(),
      multiTenant: {
        enabled: true,
        getTenantDatabase: async (tenant) => dbBySlug[tenant.slug],
        getTenantUploadsPath: (tenant) => tenant.uploadsPath,
        lookupTenant: tenantLookupFromRecords(tenants),
        resolver: { rootDomain: "example.test" },
        skipPaths: ["/api/platform", "/api/health"],
      },
    });
    const schemaId = await createMenuSchema(server, "pizza.example.test");
    const publicRole = await createRole(server, "pizza.example.test", "public");
    await server.inject({
      headers: { host: "pizza.example.test" },
      method: "PUT",
      payload: { permissions: [{ schemaId, action: "getAll", allowed: true }] },
      url: `/api/admin/roles/${publicRole}/permissions`,
    });
    await server.inject({
      headers: { host: "pizza.example.test" },
      method: "POST",
      payload: { data: { title: "Margherita" } },
      url: `/api/admin/schemas/${schemaId}/entries`,
    });

    const pizzaContent = await server.inject({
      headers: { host: "pizza.example.test" },
      method: "GET",
      url: "/api/content/menu-items",
    });
    const burgerContent = await server.inject({
      headers: { host: "burger.example.test" },
      method: "GET",
      url: "/api/content/menu-items",
    });

    expect(pizzaContent.statusCode).toBe(200);
    expect(pizzaContent.json().entries).toHaveLength(1);
    expect(burgerContent.statusCode).toBe(404);
    expect(burgerContent.json()).toEqual({ ok: false, error: "SCHEMA_NOT_FOUND" });

    await server.close();
    await Promise.all(Object.values(dbBySlug).map((db) => db.close()));
  }, tenantRuntimeTimeoutMs);

  it("routes tenant media uploads to the resolved tenant upload folder", async () => {
    const { dbBySlug, tenants, uploadsRoot } = await tenantFixture();
    await mkdir(uploadsRoot, { recursive: true });
    const server = createServer({
      adminAuth: "disabled",
      database: openMigratedSqliteAdapter(),
      uploadsPath: uploadsRoot,
      multiTenant: {
        enabled: true,
        getTenantDatabase: async (tenant) => dbBySlug[tenant.slug],
        getTenantUploadsPath: (tenant) => tenant.uploadsPath,
        lookupTenant: tenantLookupFromRecords(tenants),
        resolver: { rootDomain: "example.test" },
        skipPaths: ["/api/platform", "/api/health"],
      },
    });

    const response = await server.inject({
      headers: { host: "pizza.example.test" },
      method: "POST",
      payload: {
        contentBase64: Buffer.from("hello").toString("base64"),
        contentType: "image/png",
        filename: "hero.png",
      },
      url: "/api/admin/media",
    });

    expect(response.statusCode).toBe(200);
    const storedName = response.json().media.url.split("/").pop();
    await expect(stat(join(tenants[0].uploadsPath, storedName))).resolves.toMatchObject({
      isFile: expect.any(Function),
    });
    await expect(stat(join(tenants[1].uploadsPath, storedName))).rejects.toThrow();

    await server.close();
    await Promise.all(Object.values(dbBySlug).map((db) => db.close()));
  }, tenantRuntimeTimeoutMs);

  it("keeps automation tokens tenant-local", async () => {
    const { dbBySlug, tenants } = await tenantFixture();
    const server = createServer({
      adminAuth: "disabled",
      database: openMigratedSqliteAdapter(),
      multiTenant: {
        enabled: true,
        getTenantDatabase: async (tenant) => dbBySlug[tenant.slug],
        getTenantUploadsPath: (tenant) => tenant.uploadsPath,
        lookupTenant: tenantLookupFromRecords(tenants),
        resolver: { rootDomain: "example.test" },
        skipPaths: ["/api/platform", "/api/health"],
      },
    });
    const tokenResponse = await server.inject({
      headers: { host: "pizza.example.test" },
      method: "POST",
      payload: {
        name: "Pizza AI",
        scopes: ["schemas:manage"],
        ttlMinutes: 60,
      },
      url: "/api/admin/automation-tokens",
    });
    const token = tokenResponse.json().token as string;
    const pizzaAi = await server.inject({
      headers: {
        host: "pizza.example.test",
        "x-apiagex-automation-token": token,
      },
      method: "GET",
      url: "/api/ai/schemas",
    });
    const burgerAi = await server.inject({
      headers: {
        host: "burger.example.test",
        "x-apiagex-automation-token": token,
      },
      method: "GET",
      url: "/api/ai/schemas",
    });

    expect(tokenResponse.statusCode).toBe(200);
    expect(pizzaAi.statusCode).toBe(200);
    expect(burgerAi.statusCode).toBe(401);
    expect(burgerAi.json()).toEqual({ ok: false, error: "AUTOMATION_TOKEN_INVALID" });

    await server.close();
    await Promise.all(Object.values(dbBySlug).map((db) => db.close()));
  }, tenantRuntimeTimeoutMs);

  it("applies AI plans only to the resolved tenant database", async () => {
    const { dbBySlug, tenants } = await tenantFixture();
    const server = createServer({
      adminAuth: "disabled",
      database: openMigratedSqliteAdapter(),
      multiTenant: {
        enabled: true,
        getTenantDatabase: async (tenant) => dbBySlug[tenant.slug],
        getTenantUploadsPath: (tenant) => tenant.uploadsPath,
        lookupTenant: tenantLookupFromRecords(tenants),
        resolver: { rootDomain: "example.test" },
        skipPaths: ["/api/platform", "/api/health"],
      },
    });
    const tokenResponse = await server.inject({
      headers: { host: "pizza.example.test" },
      method: "POST",
      payload: {
        name: "Pizza Plan",
        scopes: ["plans:apply"],
        ttlMinutes: 60,
      },
      url: "/api/admin/automation-tokens",
    });
    const token = tokenResponse.json().token as string;
    const plan = {
      operations: [{
        id: "menu-schema",
        kind: "createSchema",
        reason: "Create menu",
        schema: {
          fields: [{ name: "Title", slug: "title", type: "text", required: true }],
          name: "Menu Item",
          slug: "menu-items",
        },
      }],
      summary: "Create menu schema",
      title: "Restaurant starter",
      version: 1,
    };

    const apply = await server.inject({
      headers: {
        host: "pizza.example.test",
        "x-apiagex-automation-token": token,
      },
      method: "POST",
      payload: plan,
      url: "/api/ai/plans/apply",
    });
    const pizzaSchemas = await server.inject({
      headers: { host: "pizza.example.test" },
      method: "GET",
      url: "/api/admin/schemas",
    });
    const burgerSchemas = await server.inject({
      headers: { host: "burger.example.test" },
      method: "GET",
      url: "/api/admin/schemas",
    });

    expect(apply.statusCode).toBe(200);
    expect(pizzaSchemas.json().schemas).toHaveLength(1);
    expect(burgerSchemas.json().schemas).toEqual([]);

    await server.close();
    await Promise.all(Object.values(dbBySlug).map((db) => db.close()));
  }, tenantRuntimeTimeoutMs);

  it("exports and imports tenant templates without crossing tenant data", async () => {
    const { dbBySlug, tenants } = await tenantFixture();
    const server = createServer({
      adminAuth: "disabled",
      database: openMigratedSqliteAdapter(),
      multiTenant: {
        enabled: true,
        getTenantDatabase: async (tenant) => dbBySlug[tenant.slug],
        getTenantUploadsPath: (tenant) => tenant.uploadsPath,
        lookupTenant: tenantLookupFromRecords(tenants),
        resolver: { rootDomain: "example.test" },
        skipPaths: ["/api/platform", "/api/health"],
      },
    });
    await createMenuSchema(server, "pizza.example.test");

    const exported = await server.inject({
      headers: { host: "pizza.example.test" },
      method: "GET",
      url: "/api/admin/project-template",
    });
    const imported = await server.inject({
      headers: { host: "burger.example.test" },
      method: "POST",
      payload: { template: exported.json().template },
      url: "/api/admin/project-template/import",
    });
    const burgerSchemas = await server.inject({
      headers: { host: "burger.example.test" },
      method: "GET",
      url: "/api/admin/schemas",
    });

    expect(exported.statusCode).toBe(200);
    expect(exported.json().template.tables.schemas).toHaveLength(1);
    expect(exported.json().template.tables).not.toHaveProperty("entries");
    expect(imported.statusCode).toBe(200);
    expect(imported.json().imported.schemas).toBe(1);
    expect(burgerSchemas.json().schemas).toEqual([
      expect.objectContaining({ slug: "menu-items" }),
    ]);

    await server.close();
    await Promise.all(Object.values(dbBySlug).map((db) => db.close()));
  }, tenantRuntimeTimeoutMs);

  it("keeps realtime and webhook configuration tenant-local", async () => {
    const { dbBySlug, tenants } = await tenantFixture();
    const server = createServer({
      adminAuth: "disabled",
      database: openMigratedSqliteAdapter(),
      multiTenant: {
        enabled: true,
        getTenantDatabase: async (tenant) => dbBySlug[tenant.slug],
        getTenantUploadsPath: (tenant) => tenant.uploadsPath,
        lookupTenant: tenantLookupFromRecords(tenants),
        resolver: { rootDomain: "example.test" },
        skipPaths: ["/api/platform", "/api/health"],
      },
    });
    const schemaId = await createMenuSchema(server, "pizza.example.test");
    await server.inject({
      headers: { host: "pizza.example.test" },
      method: "PUT",
      payload: { enabled: true, events: ["entry.created"] },
      url: `/api/admin/realtime/${schemaId}`,
    });
    await server.inject({
      headers: { host: "pizza.example.test" },
      method: "POST",
      payload: {
        events: ["entry.created"],
        name: "Kitchen hook",
        url: "https://example.com/kitchen",
      },
      url: "/api/admin/webhooks",
    });

    const pizzaRealtime = await server.inject({
      headers: { host: "pizza.example.test" },
      method: "GET",
      url: "/api/admin/realtime",
    });
    const burgerRealtime = await server.inject({
      headers: { host: "burger.example.test" },
      method: "GET",
      url: "/api/admin/realtime",
    });
    const pizzaWebhooks = await server.inject({
      headers: { host: "pizza.example.test" },
      method: "GET",
      url: "/api/admin/webhooks",
    });
    const burgerWebhooks = await server.inject({
      headers: { host: "burger.example.test" },
      method: "GET",
      url: "/api/admin/webhooks",
    });

    expect(pizzaRealtime.json().configs).toEqual([
      expect.objectContaining({ enabled: true, schemaId }),
    ]);
    expect(burgerRealtime.json().configs).toEqual([]);
    expect(pizzaWebhooks.json().webhooks).toHaveLength(1);
    expect(burgerWebhooks.json().webhooks).toEqual([]);

    await server.close();
    await Promise.all(Object.values(dbBySlug).map((db) => db.close()));
  }, tenantRuntimeTimeoutMs);

  it("exposes tenant labels to rate limit and metrics hooks", async () => {
    const { dbBySlug, tenants } = await tenantFixture();
    const metrics: Array<{ slug: string | null; statusCode?: number }> = [];
    const server = createServer({
      adminAuth: "disabled",
      database: openMigratedSqliteAdapter(),
      multiTenant: {
        enabled: true,
        getTenantDatabase: async (tenant) => dbBySlug[tenant.slug],
        getTenantUploadsPath: (tenant) => tenant.uploadsPath,
        lookupTenant: tenantLookupFromRecords(tenants),
        resolver: { rootDomain: "example.test" },
        skipPaths: ["/api/platform", "/api/health"],
      },
      tenantMetrics: {
        onResponse: (input) => {
          metrics.push({ slug: input.labels?.tenantSlug ?? null, statusCode: input.statusCode });
        },
      },
      tenantRateLimit: {
        check: (input) => input.labels?.tenantSlug === "burger"
          ? { allowed: false, error: "BURGER_LIMITED", retryAfterSeconds: 5 }
          : { allowed: true },
      },
    });

    const pizza = await server.inject({
      headers: { host: "pizza.example.test" },
      method: "GET",
      url: "/api/admin/schemas",
    });
    const burger = await server.inject({
      headers: { host: "burger.example.test" },
      method: "GET",
      url: "/api/admin/schemas",
    });

    expect(pizza.statusCode).toBe(200);
    expect(burger.statusCode).toBe(429);
    expect(burger.headers["retry-after"]).toBe("5");
    expect(burger.json()).toEqual({ ok: false, error: "BURGER_LIMITED" });
    expect(metrics).toEqual([
      { slug: "pizza", statusCode: 200 },
      { slug: "burger", statusCode: 429 },
    ]);

    await server.close();
    await Promise.all(Object.values(dbBySlug).map((db) => db.close()));
  }, tenantRuntimeTimeoutMs);
});

async function tenantFixture(): Promise<{
  dbBySlug: Record<string, ApiagexDatabase>;
  tenants: TenantRecord[];
  uploadsRoot: string;
}> {
  const root = await mkdtemp(join(tmpdir(), "apiagex-tenant-runtime-"));
  tempDirs.push(root);
  const uploadsRoot = join(root, "uploads");
  const dbBySlug = {
    burger: openMigratedSqliteAdapter(join(root, "burger.sqlite")),
    pizza: openMigratedSqliteAdapter(join(root, "pizza.sqlite")),
  };
  const tenants = [
    tenant("pizza", join(uploadsRoot, "pizza")),
    tenant("burger", join(uploadsRoot, "burger")),
  ];
  return { dbBySlug, tenants, uploadsRoot };
}

function tenant(slug: "burger" | "pizza", uploadsPath: string): TenantRecord {
  return {
    createdAt: "2026-05-23T00:00:00.000Z",
    databaseProvider: "sqlite",
    databaseUrlEncrypted: {
      algorithm: "aes-256-gcm",
      ciphertext: "Yw==",
      iv: "MTIzNDU2Nzg5MDEy",
      tag: "MTIzNDU2Nzg5MDEyMzQ1Ng==",
      version: 1,
    },
    displayName: slug,
    id: `tenant_${slug}`,
    lastMigrationAt: null,
    lastProvisioningError: null,
    metadata: {},
    plan: null,
    primaryDomain: null,
    slug,
    status: "active",
    subdomain: slug,
    updatedAt: "2026-05-23T00:00:00.000Z",
    uploadsPath,
  };
}

async function createMenuSchema(server: ReturnType<typeof createServer>, host: string): Promise<string> {
  const response = await server.inject({
    headers: { host },
    method: "POST",
    payload: {
      name: "Menu Item",
      slug: "menu-items",
      fields: [{ name: "Title", slug: "title", type: "text", required: true }],
    },
    url: "/api/admin/schemas",
  });
  return response.json().schema.id as string;
}

async function createRole(server: ReturnType<typeof createServer>, host: string, name: string): Promise<string> {
  const response = await server.inject({
    headers: { host },
    method: "POST",
    payload: { name },
    url: "/api/admin/roles",
  });
  return response.json().role.id as string;
}
