import { describe, expect, it } from "vitest";
import {
  createTenant,
  encryptTenantSecret,
  findTenant,
  getTenantByDomain,
  getTenantBySlug,
  listTenants,
  listTenantAuditEvents,
  migratePlatformDatabase,
  openPlatformDatabase,
  recordTenantAuditEvent,
  tenantSecretKeyFromBase64,
  toSafeTenant,
  updateTenant,
  type TenantEncryptedSecret,
} from "../src/index.js";

describe("tenant repository", () => {
  it("creates, lists, reads, updates, and sanitizes tenants", async () => {
    const db = await migratedPlatformDb();
    try {
      const tenant = await createTenant(db, {
        databaseProvider: "sqlite",
        databaseUrlEncrypted: encryptedSecret(),
        displayName: "Pizza House",
        metadata: { region: "north" },
        plan: "pro",
        primaryDomain: "pizza.example.com",
        slug: "pizza-house",
        subdomain: "pizza-house",
        uploadsPath: "/tmp/apiagex/tenants/pizza-house/uploads",
      });

      expect(tenant.status).toBe("provisioning");
      expect(tenant.databaseUrlEncrypted.ciphertext).toBeTruthy();
      expect(JSON.stringify(tenant.databaseUrlEncrypted)).not.toContain("tenant.sqlite");
      await expect(getTenantBySlug(db, "pizza-house")).resolves.toMatchObject({
        displayName: "Pizza House",
        metadata: { region: "north" },
      });

      const updated = await updateTenant(db, tenant.id, {
        lastMigrationAt: "2026-05-23T00:00:00.000Z",
        status: "active",
      });
      expect(updated.status).toBe("active");

      await expect(listTenants(db, { status: "active" })).resolves.toHaveLength(1);
      await expect(findTenant(db, { subdomain: "pizza-house" })).resolves.toMatchObject({ id: tenant.id });
      await expect(getTenantByDomain(db, "pizza.example.com:443")).resolves.toMatchObject({ id: tenant.id });

      const safe = toSafeTenant(updated);
      expect(safe.databaseUrlConfigured).toBe(true);
      expect(JSON.stringify(safe)).not.toContain("ciphertext");
    } finally {
      await db.close();
    }
  });

  it("rejects invalid tenant input", async () => {
    const db = await migratedPlatformDb();
    try {
      await expect(createTenant(db, {
        databaseProvider: "sqlite",
        databaseUrlEncrypted: encryptedSecret(),
        displayName: "Bad",
        slug: "Bad Slug",
        uploadsPath: "/tmp/bad",
      })).rejects.toThrow("TENANT_SLUG_INVALID");
      await expect(createTenant(db, {
        databaseProvider: "sqlite",
        databaseUrlEncrypted: { ...encryptedSecret(), ciphertext: "" },
        displayName: "Bad",
        slug: "bad",
        uploadsPath: "/tmp/bad",
      })).rejects.toThrow("TENANT_SECRET_ENVELOPE_INVALID");
    } finally {
      await db.close();
    }
  });

  it("records and filters sanitized tenant audit events", async () => {
    const db = await migratedPlatformDb();
    try {
      const tenant = await createTenant(db, {
        databaseProvider: "sqlite",
        databaseUrlEncrypted: encryptedSecret(),
        displayName: "Cafe Blue",
        slug: "cafe-blue",
        uploadsPath: "/tmp/apiagex/tenants/cafe-blue/uploads",
      });

      const event = await recordTenantAuditEvent(db, {
        action: "tenant.status.updated",
        actorEmail: "owner@example.com",
        actorId: "platform_owner",
        metadata: { fromStatus: "provisioning", toStatus: "active" },
        tenantId: tenant.id,
      });

      expect(event).toMatchObject({
        action: "tenant.status.updated",
        actorEmail: "owner@example.com",
        metadata: { fromStatus: "provisioning", toStatus: "active" },
        tenantId: tenant.id,
      });
      await expect(listTenantAuditEvents(db, tenant.id)).resolves.toMatchObject([{
        action: "tenant.status.updated",
      }]);
      await expect(listTenantAuditEvents(db, "missing")).resolves.toEqual([]);
      await expect(recordTenantAuditEvent(db, { action: " " })).rejects.toThrow("TENANT_AUDIT_ACTION_REQUIRED");
    } finally {
      await db.close();
    }
  });
});

async function migratedPlatformDb() {
  const db = await openPlatformDatabase({ provider: "sqlite", url: ":memory:" });
  await migratePlatformDatabase(db);
  return db;
}

function encryptedSecret(): TenantEncryptedSecret {
  return encryptTenantSecret("sqlite:///tenant.sqlite", tenantSecretKeyFromBase64(Buffer.alloc(32, 1).toString("base64")));
}
