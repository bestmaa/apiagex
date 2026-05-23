import Fastify from "fastify";
import type { TenantRecord } from "@apiagex/database";
import { describe, expect, it } from "vitest";
import {
  registerTenantContext,
  requireTenantContext,
  tenantLookupFromRecords,
} from "../src/tenant-context.js";

describe("tenant request context", () => {
  it("attaches tenant context to requests", async () => {
    const server = Fastify({ logger: false });
    const tenants = [tenant("pizza", { subdomain: "pizza" })];
    registerTenantContext(server, {
      enabled: true,
      getTenantDatabase: async () => fakeDatabase,
      getTenantUploadsPath: (item) => `/uploads/${item.slug}`,
      lookupTenant: tenantLookupFromRecords(tenants),
      resolver: { rootDomain: "yourapp.com" },
    });
    server.get("/whoami", async (request) => {
      const context = requireTenantContext(request);
      return {
        ok: true,
        provider: context.database.provider,
        tenantSlug: context.tenantSlug,
        uploadsPath: context.uploadsPath,
      };
    });

    const response = await server.inject({
      headers: { host: "pizza.yourapp.com" },
      method: "GET",
      url: "/whoami",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      ok: true,
      provider: "sqlite",
      tenantSlug: "pizza",
      uploadsPath: "/uploads/pizza",
    });
    await server.close();
  });

  it("returns resolver errors before tenant routes run", async () => {
    const server = Fastify({ logger: false });
    registerTenantContext(server, {
      enabled: true,
      getTenantDatabase: async () => fakeDatabase,
      getTenantUploadsPath: (item) => `/uploads/${item.slug}`,
      lookupTenant: tenantLookupFromRecords([tenant("pizza", { status: "suspended", subdomain: "pizza" })]),
      resolver: { rootDomain: "yourapp.com" },
    });
    server.get("/whoami", async () => ({ ok: true }));

    const response = await server.inject({
      headers: { host: "pizza.yourapp.com" },
      method: "GET",
      url: "/whoami",
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toEqual({ ok: false, error: "TENANT_SUSPENDED" });
    await server.close();
  });

  it("can skip platform paths and keep tenant context disabled", async () => {
    const server = Fastify({ logger: false });
    registerTenantContext(server, {
      enabled: true,
      getTenantDatabase: async () => fakeDatabase,
      getTenantUploadsPath: (item) => `/uploads/${item.slug}`,
      lookupTenant: tenantLookupFromRecords([]),
      resolver: { rootDomain: "yourapp.com" },
      skipPaths: ["/api/platform"],
    });
    server.get("/api/platform/health", async (request) => ({
      ok: true,
      tenantContext: request.apiagexTenant,
    }));

    const response = await server.inject({
      headers: { host: "missing.yourapp.com" },
      method: "GET",
      url: "/api/platform/health",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ ok: true, tenantContext: null });
    await server.close();
  });
});

const fakeDatabase = {
  close: async () => undefined,
  exec: async () => undefined,
  prepare: () => ({
    all: async () => [],
    get: async () => undefined,
    run: async () => ({ changes: 0 }),
  }),
  provider: "sqlite" as const,
  transaction: async <TResult>(callback: () => Promise<TResult>) => callback(),
};

function tenant(slug: string, patch: Partial<TenantRecord> = {}): TenantRecord {
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
    subdomain: null,
    updatedAt: "2026-05-23T00:00:00.000Z",
    uploadsPath: `/tmp/${slug}`,
    ...patch,
  };
}
