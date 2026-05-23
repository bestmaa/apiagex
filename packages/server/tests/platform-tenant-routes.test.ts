import Fastify from "fastify";
import {
  decryptTenantSecret,
  getTenantBySlug,
  listTenantAuditEvents,
  migratePlatformDatabase,
  openMigratedSqliteAdapter,
  openSqliteAdapter,
  resolveAutomationToken,
} from "@apiagex/database";
import { describe, expect, it } from "vitest";
import { registerPlatformAdminAuthGuard } from "../src/platform-admin-auth.js";
import { registerPlatformTenantRoutes } from "../src/platform-tenant-routes.js";

const secretKey = { key: Buffer.alloc(32, 15) };

describe("platform tenant routes", () => {
  it("creates a tenant through the platform boundary and returns a sanitized response", async () => {
    const platformDb = openSqliteAdapter();
    await migratePlatformDatabase(platformDb, "sqlite");
    const server = Fastify({ logger: false });
    const invalidatedTenantIds: string[] = [];
    const tenantDb = openMigratedSqliteAdapter();
    registerPlatformAdminAuthGuard(server, "platform-secret");
    registerPlatformTenantRoutes(server, platformDb, {
      getTenantDatabase: async () => tenantDb,
      onTenantSecretRotated: (tenantId) => invalidatedTenantIds.push(tenantId),
      secretKey,
    });

    const blocked = await server.inject({
      method: "POST",
      payload: {},
      url: "/api/platform/tenants",
    });
    const created = await server.inject({
      headers: { "x-apiagex-platform-token": "platform-secret" },
      method: "POST",
      payload: {
        databaseProvider: "sqlite",
        databaseUrl: "file:/tmp/pizza.sqlite",
        displayName: "Pizza House",
        metadata: { plan: "starter" },
        slug: "pizza-house",
        uploadsPath: "/tmp/uploads/pizza-house",
      },
      url: "/api/platform/tenants",
    });

    expect(blocked.statusCode).toBe(401);
    expect(created.statusCode).toBe(200);
    expect(created.json().tenant).toMatchObject({
      databaseProvider: "sqlite",
      databaseUrlConfigured: true,
      displayName: "Pizza House",
      slug: "pizza-house",
      status: "active",
    });
    expect(created.body).not.toContain("file:/tmp/pizza.sqlite");
    expect(created.body).not.toContain("ciphertext");

    const tenant = await getTenantBySlug(platformDb, "pizza-house");
    expect(tenant).toBeDefined();
    expect(decryptTenantSecret(tenant!.databaseUrlEncrypted, secretKey)).toBe("file:/tmp/pizza.sqlite");
    const events = await listTenantAuditEvents(platformDb, tenant!.id);
    expect(events.map((event) => event.action)).toContain("tenant.created");

    const list = await server.inject({
      headers: { "x-apiagex-platform-token": "platform-secret" },
      method: "GET",
      url: "/api/platform/tenants",
    });
    const read = await server.inject({
      headers: { "x-apiagex-platform-token": "platform-secret" },
      method: "GET",
      url: `/api/platform/tenants/${tenant!.id}`,
    });

    expect(list.statusCode).toBe(200);
    expect(list.json().tenants).toHaveLength(1);
    expect(list.body).not.toContain("file:/tmp/pizza.sqlite");
    expect(read.statusCode).toBe(200);
    expect(read.json().tenant).toMatchObject({ id: tenant!.id, slug: "pizza-house" });
    expect(read.body).not.toContain("ciphertext");

    const suspended = await server.inject({
      headers: { "x-apiagex-platform-token": "platform-secret" },
      method: "PATCH",
      payload: { status: "suspended" },
      url: `/api/platform/tenants/${tenant!.id}/status`,
    });
    expect(suspended.statusCode).toBe(200);
    expect(suspended.json().tenant).toMatchObject({ id: tenant!.id, status: "suspended" });
    expect(suspended.body).not.toContain("file:/tmp/pizza.sqlite");

    await server.inject({
      headers: { "x-apiagex-platform-token": "platform-secret" },
      method: "PATCH",
      payload: { status: "failed" },
      url: `/api/platform/tenants/${tenant!.id}/status`,
    });
    const reprovision = await server.inject({
      headers: { "x-apiagex-platform-token": "platform-secret" },
      method: "POST",
      payload: { cleanup: "not_attempted" },
      url: `/api/platform/tenants/${tenant!.id}/reprovision`,
    });
    expect(reprovision.statusCode).toBe(200);
    expect(reprovision.json().tenant).toMatchObject({ id: tenant!.id, status: "provisioning" });

    const rotated = await server.inject({
      headers: { "x-apiagex-platform-token": "platform-secret" },
      method: "POST",
      payload: { databaseUrl: "file:/tmp/pizza-rotated.sqlite" },
      url: `/api/platform/tenants/${tenant!.id}/rotate-secret`,
    });
    const rotatedTenant = await getTenantBySlug(platformDb, "pizza-house");
    expect(rotated.statusCode).toBe(200);
    expect(rotated.body).not.toContain("pizza-rotated.sqlite");
    expect(decryptTenantSecret(rotatedTenant!.databaseUrlEncrypted, secretKey))
      .toBe("file:/tmp/pizza-rotated.sqlite");
    expect(invalidatedTenantIds).toEqual([tenant!.id]);

    const tenantToken = await server.inject({
      headers: { "x-apiagex-platform-token": "platform-secret" },
      method: "POST",
      payload: { name: "Tenant AI", scopes: ["schemas:manage"], ttlMinutes: 30 },
      url: `/api/platform/tenants/${tenant!.id}/automation-token`,
    });
    expect(tenantToken.statusCode).toBe(200);
    expect(tenantToken.json().token).toMatch(/^agx_auto_/);
    expect(await resolveAutomationToken(tenantDb, tenantToken.json().token, ["schemas:manage"])).toBeTruthy();
    await platformDb.close();
    await tenantDb.close();
  });

  it("rejects missing create fields", async () => {
    const platformDb = openSqliteAdapter();
    await migratePlatformDatabase(platformDb, "sqlite");
    const server = Fastify({ logger: false });
    registerPlatformAdminAuthGuard(server, "platform-secret");
    registerPlatformTenantRoutes(server, platformDb, { secretKey });

    const response = await server.inject({
      headers: { authorization: "Bearer platform-secret" },
      method: "POST",
      payload: { slug: "pizza-house" },
      url: "/api/platform/tenants",
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ ok: false, error: "TENANT_CREATE_REQUIRED_FIELDS_MISSING" });
    await platformDb.close();
  });

  it("returns 404 for a missing tenant", async () => {
    const platformDb = openSqliteAdapter();
    await migratePlatformDatabase(platformDb, "sqlite");
    const server = Fastify({ logger: false });
    registerPlatformAdminAuthGuard(server, "platform-secret");
    registerPlatformTenantRoutes(server, platformDb, { secretKey });

    const response = await server.inject({
      headers: { authorization: "Bearer platform-secret" },
      method: "GET",
      url: "/api/platform/tenants/missing",
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ ok: false, error: "TENANT_NOT_FOUND" });
    await platformDb.close();
  });

  it("rejects invalid tenant status updates", async () => {
    const platformDb = openSqliteAdapter();
    await migratePlatformDatabase(platformDb, "sqlite");
    const server = Fastify({ logger: false });
    registerPlatformAdminAuthGuard(server, "platform-secret");
    registerPlatformTenantRoutes(server, platformDb, { secretKey });

    const response = await server.inject({
      headers: { authorization: "Bearer platform-secret" },
      method: "PATCH",
      payload: { status: "paused" },
      url: "/api/platform/tenants/tenant_1/status",
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ ok: false, error: "TENANT_STATUS_INVALID" });
    await platformDb.close();
  });

  it("rejects reprovision retry unless tenant is failed", async () => {
    const platformDb = openSqliteAdapter();
    await migratePlatformDatabase(platformDb, "sqlite");
    const server = Fastify({ logger: false });
    registerPlatformAdminAuthGuard(server, "platform-secret");
    registerPlatformTenantRoutes(server, platformDb, { secretKey });

    const response = await server.inject({
      headers: { authorization: "Bearer platform-secret" },
      method: "POST",
      url: "/api/platform/tenants/missing/reprovision",
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ ok: false, error: "TENANT_NOT_FOUND" });
    await platformDb.close();
  });

  it("rejects missing rotation secrets", async () => {
    const platformDb = openSqliteAdapter();
    await migratePlatformDatabase(platformDb, "sqlite");
    const server = Fastify({ logger: false });
    registerPlatformAdminAuthGuard(server, "platform-secret");
    registerPlatformTenantRoutes(server, platformDb, { secretKey });

    const response = await server.inject({
      headers: { authorization: "Bearer platform-secret" },
      method: "POST",
      payload: {},
      url: "/api/platform/tenants/tenant_1/rotate-secret",
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ ok: false, error: "TENANT_SECRET_ROTATION_DATABASE_URL_REQUIRED" });
    await platformDb.close();
  });
});
