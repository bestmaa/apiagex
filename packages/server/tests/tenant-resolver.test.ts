import type { TenantLookup, TenantRecord } from "@apiagex/database";
import { describe, expect, it } from "vitest";
import {
  normalizeHost,
  resolveTenant,
  statusError,
  type TenantResolverLookup,
} from "../src/tenant-resolver.js";

describe("tenant resolver", () => {
  it("resolves exact custom domains before subdomains", async () => {
    const lookup = tenantLookup([
      tenant("pizza-house", { primaryDomain: "pizza.example.com", subdomain: "pizza" }),
      tenant("pizza", { subdomain: "pizza" }),
    ]);

    const result = await resolveTenant(
      { host: "pizza.example.com", path: "/api/content/menu" },
      { rootDomain: "example.com" },
      lookup,
    );

    expect(result).toMatchObject({
      mode: "customDomain",
      ok: true,
      tenantSlug: "pizza-house",
      rewrittenPath: "/api/content/menu",
    });
  });

  it("resolves subdomains under the configured root domain", async () => {
    const result = await resolveTenant(
      { host: "Burger-Point.YourApp.com:443", path: "/adminui" },
      { rootDomain: "yourapp.com" },
      tenantLookup([tenant("burger-point", { subdomain: "burger-point" })]),
    );

    expect(result).toMatchObject({
      mode: "subdomain",
      ok: true,
      tenantSlug: "burger-point",
    });
  });

  it("resolves local path prefixes and rewrites the path", async () => {
    const result = await resolveTenant(
      { host: "127.0.0.1:4000", path: "/t/cafe-blue/api/content/menu" },
      { resolutionOrder: ["path"] },
      tenantLookup([tenant("cafe-blue")]),
    );

    expect(result).toMatchObject({
      mode: "pathPrefix",
      ok: true,
      rewrittenPath: "/api/content/menu",
      tenantSlug: "cafe-blue",
    });
  });

  it("rejects unsafe hosts, reserved subdomains, and inactive tenants", async () => {
    await expect(resolveTenant(
      { host: "bad host", path: "/adminui" },
      {},
      tenantLookup([]),
    )).resolves.toEqual({ error: "TENANT_HOST_INVALID", ok: false, statusCode: 400 });

    await expect(resolveTenant(
      { host: "admin.yourapp.com", path: "/adminui" },
      { rootDomain: "yourapp.com" },
      tenantLookup([tenant("admin", { subdomain: "admin" })]),
    )).resolves.toEqual({ error: "TENANT_RESERVED_SUBDOMAIN", ok: false, statusCode: 404 });

    await expect(resolveTenant(
      { host: "pizza.yourapp.com", path: "/adminui" },
      { rootDomain: "yourapp.com" },
      tenantLookup([tenant("pizza", { status: "suspended", subdomain: "pizza" })]),
    )).resolves.toEqual({ error: "TENANT_SUSPENDED", ok: false, statusCode: 403 });
  });

  it("uses forwarded host only when trusted proxy is enabled", async () => {
    const lookup = tenantLookup([tenant("pizza", { subdomain: "pizza" })]);

    await expect(resolveTenant(
      { headers: { host: "127.0.0.1:4000", "x-forwarded-host": "pizza.yourapp.com" }, path: "/adminui" },
      { rootDomain: "yourapp.com", trustProxy: false },
      lookup,
    )).resolves.toMatchObject({ error: "TENANT_NOT_FOUND", ok: false });

    await expect(resolveTenant(
      { headers: { host: "127.0.0.1:4000", "x-forwarded-host": "pizza.yourapp.com" }, path: "/adminui" },
      { rootDomain: "yourapp.com", trustProxy: true },
      lookup,
    )).resolves.toMatchObject({ ok: true, tenantSlug: "pizza" });
  });

  it("normalizes hosts and maps lifecycle statuses", () => {
    expect(normalizeHost("Pizza.YourApp.com:443")).toBe("pizza.yourapp.com");
    expect(normalizeHost("bad/host")).toBeUndefined();
    expect(statusError("active")).toBeUndefined();
    expect(statusError("migration_required")).toBe("TENANT_MIGRATION_REQUIRED");
    expect(statusError("archived")).toBe("TENANT_ARCHIVED");
  });
});

function tenantLookup(tenants: TenantRecord[]): TenantResolverLookup {
  return async (lookup: TenantLookup) => {
    if (lookup.domain) return tenants.find((item) => item.primaryDomain === lookup.domain);
    if (lookup.subdomain) return tenants.find((item) => item.subdomain === lookup.subdomain);
    if (lookup.slug) return tenants.find((item) => item.slug === lookup.slug);
    if (lookup.id) return tenants.find((item) => item.id === lookup.id);
    return undefined;
  };
}

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
