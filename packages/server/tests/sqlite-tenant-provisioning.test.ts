import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  decryptTenantSecret,
  openSqliteAdapter,
  sqlitePathFromUrl,
} from "@apiagex/database";
import { afterEach, describe, expect, it } from "vitest";
import {
  provisionSqliteTenant,
  resolveSqliteTenantProvisioningPaths,
} from "../src/sqlite-tenant-provisioning.js";
import type { TenantProvisioningProgressEvent } from "../src/tenant-provisioning.type.js";

const tempDirs: string[] = [];
const secretKey = { key: Buffer.alloc(32, 7) };

describe("sqlite tenant provisioning", () => {
  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { force: true, recursive: true })));
  });

  it("creates a migrated tenant database, uploads folder, and encrypted database URL", async () => {
    const root = await tempRoot();
    const events: TenantProvisioningProgressEvent[] = [];

    const result = await provisionSqliteTenant(
      {
        provider: "sqlite",
        secretKey,
        tenantDatabasesRoot: join(root, "databases"),
        uploadsRoot: join(root, "uploads"),
      },
      {
        emit: (event) => events.push(event),
        request: {
          actor: { source: "admin" },
          displayName: "Pizza House",
          owner: {
            email: "OWNER@EXAMPLE.COM",
            password: "password-123",
          },
          provider: "sqlite",
          slug: "pizza-house",
          tenantId: "tenant_1",
        },
      },
    );

    const databaseUrl = decryptTenantSecret(result.encryptedDatabaseUrl, secretKey);
    const db = openSqliteAdapter(sqlitePathFromUrl(databaseUrl));
    const owner = await db
      .prepare("SELECT users.email FROM users JOIN roles ON roles.id = users.role_id WHERE roles.is_owner = 1")
      .get<{ email: string }>();

    expect(result.provider).toBe("sqlite");
    expect(result.uploadsPath).toBe(join(root, "uploads", "pizza-house", "uploads"));
    expect(databaseUrl).toBe(`file:${join(root, "databases", "pizza-house", "apiagex.sqlite")}`);
    expect(owner).toEqual({ email: "owner@example.com" });
    await expect(stat(result.uploadsPath)).resolves.toMatchObject({ isDirectory: expect.any(Function) });
    expect(events.map((event) => `${event.step}:${event.status}`)).toContain("activateTenant:completed");
    await db.close();
  });

  it("keeps sqlite database and uploads paths inside configured roots", async () => {
    const root = await tempRoot();
    const paths = resolveSqliteTenantProvisioningPaths(
      {
        tenantDatabasesRoot: join(root, "databases"),
        uploadsRoot: join(root, "uploads"),
      },
      "cafe-blue",
    );

    expect(paths.databasePath).toBe(join(root, "databases", "cafe-blue", "apiagex.sqlite"));
    expect(paths.uploadsPath).toBe(join(root, "uploads", "cafe-blue", "uploads"));
    expect(() => resolveSqliteTenantProvisioningPaths(
      {
        tenantDatabasesRoot: join(root, "databases"),
        uploadsRoot: join(root, "uploads"),
      },
      "../bad",
    )).toThrow("TENANT_PROVISIONING_SLUG_INVALID");
  });
});

async function tempRoot(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "apiagex-sqlite-tenant-"));
  tempDirs.push(dir);
  return dir;
}
