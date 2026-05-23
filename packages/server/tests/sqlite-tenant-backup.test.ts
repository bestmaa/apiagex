import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { backupSqliteTenant, restoreSqliteTenant } from "../src/sqlite-tenant-backup.js";

describe("sqlite tenant backup and restore", () => {
  it("exports and restores sqlite tenant database plus uploads", async () => {
    const root = await mkdtemp(join(tmpdir(), "apiagex-sqlite-backup-"));
    const sourceDb = join(root, "source", "tenant.sqlite");
    const sourceUploads = join(root, "source", "uploads");
    await mkdir(join(sourceUploads, "menus"), { recursive: true });
    await writeFile(sourceDb, "sqlite-bytes", "utf8");
    await writeFile(join(sourceUploads, "menus", "logo.txt"), "logo-bytes", "utf8");

    const backup = await backupSqliteTenant({
      databasePath: sourceDb,
      outputPath: join(root, "backup"),
      tenant: {
        id: "tenant_1",
        provider: "sqlite",
        slug: "restaurant-one",
        status: "active",
      },
      uploadsPath: sourceUploads,
    });

    expect(backup.manifest.includes.secrets).toBe(false);
    expect(backup.manifest.database.provider).toBe("sqlite");
    expect(backup.manifest.uploads.files).toHaveLength(1);

    const restore = await restoreSqliteTenant({
      backupPath: join(root, "backup"),
      databasePath: join(root, "restored", "tenant.sqlite"),
      expectedTenantSlug: "restaurant-one",
      uploadsPath: join(root, "restored", "uploads"),
    });

    expect(restore.manifest.tenant.slug).toBe("restaurant-one");
    expect(await readFile(join(root, "restored", "tenant.sqlite"), "utf8")).toBe("sqlite-bytes");
    expect(await readFile(join(root, "restored", "uploads", "menus", "logo.txt"), "utf8")).toBe("logo-bytes");
  });

  it("refuses to overwrite an existing target without explicit approval", async () => {
    const root = await mkdtemp(join(tmpdir(), "apiagex-sqlite-backup-"));
    const sourceDb = join(root, "source.sqlite");
    const targetDb = join(root, "target.sqlite");
    await writeFile(sourceDb, "sqlite-bytes", "utf8");
    await writeFile(targetDb, "existing", "utf8");

    await backupSqliteTenant({
      databasePath: sourceDb,
      outputPath: join(root, "backup"),
      tenant: {
        id: "tenant_1",
        provider: "sqlite",
        slug: "restaurant-one",
      },
      uploadsPath: join(root, "missing-uploads"),
    });

    await expect(restoreSqliteTenant({
      backupPath: join(root, "backup"),
      databasePath: targetDb,
      uploadsPath: join(root, "restored-uploads"),
    })).rejects.toThrow("TENANT_RESTORE_DATABASE_EXISTS");
  });
});
