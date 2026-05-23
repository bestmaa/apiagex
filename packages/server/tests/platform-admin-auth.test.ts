import Fastify from "fastify";
import { describe, expect, it } from "vitest";
import {
  isPlatformApiPath,
  registerPlatformAdminAuthGuard,
  verifyPlatformAdminToken,
} from "../src/platform-admin-auth.js";

describe("platform admin auth boundary", () => {
  it("guards only platform API paths", async () => {
    const server = Fastify({ logger: false });
    registerPlatformAdminAuthGuard(server, "platform-secret");
    server.get("/api/platform/tenants", async () => ({ ok: true }));
    server.get("/api/admin/schemas", async () => ({ ok: true }));

    const blocked = await server.inject({ method: "GET", url: "/api/platform/tenants" });
    const allowed = await server.inject({
      headers: { authorization: "Bearer platform-secret" },
      method: "GET",
      url: "/api/platform/tenants",
    });
    const tenantAdmin = await server.inject({ method: "GET", url: "/api/admin/schemas" });

    expect(blocked.statusCode).toBe(401);
    expect(blocked.json()).toEqual({ ok: false, error: "PLATFORM_ADMIN_AUTH_REQUIRED" });
    expect(allowed.statusCode).toBe(200);
    expect(tenantAdmin.statusCode).toBe(200);
  });

  it("verifies platform tokens without accepting tenant admin tokens implicitly", () => {
    expect(verifyPlatformAdminToken("platform-secret", "platform-secret")).toEqual({ ok: true });
    expect(verifyPlatformAdminToken("platform-secret", "owner:tenant:token")).toEqual({
      error: "PLATFORM_ADMIN_AUTH_INVALID",
      ok: false,
    });
    expect(verifyPlatformAdminToken(undefined, "platform-secret")).toEqual({
      error: "PLATFORM_ADMIN_AUTH_REQUIRED",
      ok: false,
    });
  });

  it("detects platform paths separately from tenant admin paths", () => {
    expect(isPlatformApiPath("/api/platform")).toBe(true);
    expect(isPlatformApiPath("/api/platform/tenants")).toBe(true);
    expect(isPlatformApiPath("/api/admin")).toBe(false);
    expect(isPlatformApiPath("/api/admin/schemas")).toBe(false);
  });
});
