import type { ApiagexDatabase, TenantRecord } from "@apiagex/database";
import { describe, expect, it } from "vitest";
import { TenantConnectionCache } from "../src/tenant-connection-cache.js";

describe("tenant connection cache", () => {
  it("reuses tenant database connections until invalidated", async () => {
    const opened: string[] = [];
    const closed: string[] = [];
    const cache = new TenantConnectionCache({
      openTenantDatabase: async (tenant) => {
        opened.push(tenant.id);
        return fakeDatabase(tenant.id, closed);
      },
    });

    const first = await cache.get(tenant("one"));
    const second = await cache.get(tenant("one"));

    expect(first).toBe(second);
    expect(opened).toEqual(["tenant_one"]);
    await cache.invalidate("tenant_one");
    expect(closed).toEqual(["tenant_one"]);
    expect(cache.size).toBe(0);
  });

  it("expires and evicts connections", async () => {
    let now = 0;
    const closed: string[] = [];
    const cache = new TenantConnectionCache({
      maxConnections: 1,
      now: () => now,
      openTenantDatabase: async (tenant) => fakeDatabase(tenant.id, closed),
      ttlMs: 10,
    });

    const first = await cache.get(tenant("one"));
    now = 11;
    const expired = await cache.get(tenant("one"));
    expect(expired).not.toBe(first);
    expect(closed).toEqual(["tenant_one"]);

    await cache.get(tenant("two"));
    expect(cache.size).toBe(1);
    expect(closed).toEqual(["tenant_one", "tenant_one"]);
    await cache.closeAll();
    expect(closed).toEqual(["tenant_one", "tenant_one", "tenant_two"]);
  });
});

function fakeDatabase(id: string, closed: string[]): ApiagexDatabase {
  return {
    close: async () => {
      closed.push(id);
    },
    exec: async () => undefined,
    prepare: () => ({
      all: async () => [],
      get: async () => undefined,
      run: async () => ({ changes: 0 }),
    }),
    provider: "sqlite",
    transaction: async <TResult>(callback: () => Promise<TResult>) => callback(),
  };
}

function tenant(slug: string): TenantRecord {
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
  };
}
