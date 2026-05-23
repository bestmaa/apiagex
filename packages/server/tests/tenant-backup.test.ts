import { describe, expect, it } from "vitest";
import { isTenantBackupManifest, TENANT_BACKUP_FORMAT_VERSION, type TenantBackupManifest } from "../src/tenant-backup.js";

const checksum = "a".repeat(64);

describe("tenant backup manifest contract", () => {
  it("accepts the documented v1 tenant backup manifest shape", () => {
    const manifest: TenantBackupManifest = {
      createdAt: "2026-05-23T08:00:00.000Z",
      database: {
        artifactPath: "database/tenant.sqlite",
        checksumSha256: checksum,
        provider: "sqlite",
        sizeBytes: 1024,
      },
      formatVersion: TENANT_BACKUP_FORMAT_VERSION,
      includes: {
        contentData: true,
        secrets: false,
        uploads: true,
      },
      tenant: {
        domain: "restaurant-one.example.test",
        id: "tenant_1",
        provider: "sqlite",
        slug: "restaurant-one",
        status: "active",
      },
      uploads: {
        basePath: "uploads/",
        files: [
          {
            checksumSha256: checksum,
            contentType: "image/png",
            path: "uploads/menu/logo.png",
            sizeBytes: 512,
          },
        ],
      },
    };

    expect(isTenantBackupManifest(manifest)).toBe(true);
  });

  it("rejects secrets and unsafe paths", () => {
    expect(isTenantBackupManifest({
      createdAt: "2026-05-23T08:00:00.000Z",
      database: {
        artifactPath: "../tenant.sqlite",
        checksumSha256: checksum,
        provider: "sqlite",
        sizeBytes: 1024,
      },
      encryptedDatabaseUrl: "secret",
      formatVersion: TENANT_BACKUP_FORMAT_VERSION,
      includes: {
        contentData: true,
        secrets: false,
        uploads: false,
      },
      tenant: {
        id: "tenant_1",
        provider: "sqlite",
        slug: "restaurant-one",
      },
      uploads: {
        basePath: "uploads/",
        files: [],
      },
    })).toBe(false);
  });
});
