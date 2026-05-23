import {
  createTenant,
  encryptTenantSecret,
  migratePlatformDatabase,
  openSqliteAdapter,
} from "@apiagex/database";
import { describe, expect, it } from "vitest";
import {
  markTenantProvisioningFailed,
  redactTenantSecretText,
  sanitizedProvisioningError,
} from "../src/tenant-provisioning-rollback.js";

const secretKey = { key: Buffer.alloc(32, 13) };

describe("tenant provisioning rollback", () => {
  it("marks a provisioning tenant failed and records sanitized audit metadata", async () => {
    const platformDb = openSqliteAdapter();
    await migratePlatformDatabase(platformDb, "sqlite");
    const tenant = await createTenant(platformDb, {
      databaseProvider: "sqlite",
      databaseUrlEncrypted: encryptTenantSecret("file:/tmp/pizza.sqlite", secretKey),
      displayName: "Pizza House",
      slug: "pizza-house",
      status: "provisioning",
      uploadsPath: "/tmp/uploads/pizza-house",
    });

    const result = await markTenantProvisioningFailed(platformDb, {
      actor: { id: "admin_1", source: "admin" },
      error: new Error("connect postgres://admin:secret@localhost/postgres failed"),
      tenantId: tenant.id,
    });

    expect(result.tenant.status).toBe("failed");
    expect(result.cleanup).toBe("not_attempted");
    expect(result.auditEvent).toMatchObject({
      action: "tenant.provisioning.failed",
      actorId: "admin_1",
      tenantId: tenant.id,
    });
    expect(result.auditEvent.metadata).toMatchObject({ actorType: "admin", cleanup: "not_attempted" });
    expect(JSON.stringify(result.auditEvent.metadata)).toContain("postgres://***@localhost/postgres");
    expect(JSON.stringify(result.auditEvent.metadata)).not.toContain("secret");
    await platformDb.close();
  });

  it("keeps rollback errors short and generic when needed", () => {
    expect(sanitizedProvisioningError("bad")).toBe("TENANT_PROVISIONING_FAILED");
    expect(sanitizedProvisioningError(new Error(""))).toBe("TENANT_PROVISIONING_FAILED");
    expect(sanitizedProvisioningError(new Error("x".repeat(200)))).toHaveLength(160);
  });

  it("redacts tenant database credentials, passwords, and tokens", () => {
    const unsafe = [
      "connect mysql://apiagex:super-pass@localhost:3306/tenant failed",
      "databaseUrl=postgres://admin:pass@db.example/tenant",
      "password=OwnerPass123 token=api_secret_123 api_key=key_123",
      "{\"encrypted_database_url\":\"ciphertext\",\"secret\":\"hook-secret\",\"apiKey\":\"abc\"}",
    ].join(" ");

    const safe = redactTenantSecretText(unsafe);

    expect(safe).toContain("mysql://***@localhost:3306/tenant");
    expect(safe).toContain("databaseUrl=***");
    expect(safe).toContain("password=***");
    expect(safe).toContain("token=***");
    expect(safe).toContain("api_key=***");
    expect(safe).toContain("\"encrypted_database_url\":\"***\"");
    expect(safe).toContain("\"secret\":\"***\"");
    expect(safe).not.toContain("super-pass");
    expect(safe).not.toContain("OwnerPass123");
    expect(safe).not.toContain("api_secret_123");
    expect(safe).not.toContain("ciphertext");
  });
});
