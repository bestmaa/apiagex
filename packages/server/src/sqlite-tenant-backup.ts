import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { access, copyFile, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, join, relative, sep } from "node:path";
import {
  isTenantBackupManifest,
  TENANT_BACKUP_FORMAT_VERSION,
  type TenantBackupFileManifest,
  type TenantBackupManifest,
} from "./tenant-backup.js";

export type BackupSqliteTenantInput = {
  apiagexVersion?: string;
  databasePath: string;
  outputPath: string;
  tenant: TenantBackupManifest["tenant"];
  uploadsPath: string;
};

export type RestoreSqliteTenantInput = {
  allowOverwrite?: boolean;
  backupPath: string;
  databasePath: string;
  expectedTenantSlug?: string;
  uploadsPath: string;
};

export type SqliteTenantBackupResult = {
  databasePath: string;
  manifest: TenantBackupManifest;
  outputPath: string;
  uploadsPath: string;
};

export async function backupSqliteTenant(input: BackupSqliteTenantInput): Promise<SqliteTenantBackupResult> {
  const outputDatabasePath = join(input.outputPath, "database", basename(input.databasePath));
  const outputUploadsPath = join(input.outputPath, "uploads");
  await mkdir(dirname(outputDatabasePath), { recursive: true });
  await mkdir(outputUploadsPath, { recursive: true });
  await copyFile(input.databasePath, outputDatabasePath);
  const databaseBytes = await readFile(outputDatabasePath);
  const uploadFiles = await copyUploads(input.uploadsPath, outputUploadsPath);
  const manifest: TenantBackupManifest = {
    createdAt: new Date().toISOString(),
    database: {
      artifactPath: `database/${basename(input.databasePath)}`,
      checksumSha256: sha256(databaseBytes),
      provider: "sqlite",
      sizeBytes: databaseBytes.byteLength,
    },
    formatVersion: TENANT_BACKUP_FORMAT_VERSION,
    includes: {
      contentData: true,
      secrets: false,
      uploads: uploadFiles.length > 0,
    },
    ...(input.apiagexVersion ? { source: { apiagexVersion: input.apiagexVersion } } : {}),
    tenant: {
      ...input.tenant,
      provider: "sqlite",
    },
    uploads: {
      basePath: "uploads/",
      files: uploadFiles,
    },
  };
  await writeFile(join(input.outputPath, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return {
    databasePath: outputDatabasePath,
    manifest,
    outputPath: input.outputPath,
    uploadsPath: outputUploadsPath,
  };
}

export async function restoreSqliteTenant(input: RestoreSqliteTenantInput): Promise<SqliteTenantBackupResult> {
  const manifest = JSON.parse(await readFile(join(input.backupPath, "manifest.json"), "utf8")) as unknown;
  if (!isTenantBackupManifest(manifest)) throw new Error("TENANT_BACKUP_MANIFEST_INVALID");
  if (manifest.database.provider !== "sqlite") throw new Error("TENANT_BACKUP_PROVIDER_UNSUPPORTED");
  if (input.expectedTenantSlug && manifest.tenant.slug !== input.expectedTenantSlug) {
    throw new Error("TENANT_BACKUP_TENANT_MISMATCH");
  }
  if (!input.allowOverwrite) {
    await assertMissing(input.databasePath, "TENANT_RESTORE_DATABASE_EXISTS");
    await assertMissing(input.uploadsPath, "TENANT_RESTORE_UPLOADS_EXISTS");
  }

  const sourceDatabasePath = join(input.backupPath, manifest.database.artifactPath);
  await assertChecksum(sourceDatabasePath, manifest.database.checksumSha256);
  for (const file of manifest.uploads.files) {
    await assertChecksum(join(input.backupPath, file.path), file.checksumSha256);
  }

  await mkdir(dirname(input.databasePath), { recursive: true });
  await mkdir(input.uploadsPath, { recursive: true });
  await copyFile(sourceDatabasePath, input.databasePath);
  for (const file of manifest.uploads.files) {
    const sourcePath = join(input.backupPath, file.path);
    const targetPath = join(input.uploadsPath, file.path.replace(/^uploads\//, ""));
    await mkdir(dirname(targetPath), { recursive: true });
    await copyFile(sourcePath, targetPath);
  }

  return {
    databasePath: input.databasePath,
    manifest,
    outputPath: input.backupPath,
    uploadsPath: input.uploadsPath,
  };
}

async function copyUploads(sourceRoot: string, targetRoot: string): Promise<TenantBackupFileManifest[]> {
  if (!await exists(sourceRoot)) return [];
  const files: TenantBackupFileManifest[] = [];
  for (const sourcePath of await listFiles(sourceRoot)) {
    const relativePath = relative(sourceRoot, sourcePath).split(sep).join("/");
    const targetPath = join(targetRoot, relativePath);
    await mkdir(dirname(targetPath), { recursive: true });
    await copyFile(sourcePath, targetPath);
    const bytes = await readFile(targetPath);
    files.push({
      checksumSha256: sha256(bytes),
      path: `uploads/${relativePath}`,
      sizeBytes: bytes.byteLength,
    });
  }
  return files.sort((left, right) => left.path.localeCompare(right.path));
}

async function listFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(root, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(fullPath));
    else if (entry.isFile()) files.push(fullPath);
  }
  return files;
}

async function assertChecksum(path: string, expected: string): Promise<void> {
  const bytes = await readFile(path);
  if (sha256(bytes) !== expected) throw new Error("TENANT_BACKUP_CHECKSUM_MISMATCH");
}

async function assertMissing(path: string, code: string): Promise<void> {
  if (await exists(path)) throw new Error(code);
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function sha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}
