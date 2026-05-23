import { mkdir } from "node:fs/promises";
import { resolve, sep } from "node:path";
import type { TenantRecord } from "@apiagex/database";

export type TenantUploadsConfig = {
  root: string;
};

export type TenantUploadsResolution = {
  publicPrefix: string;
  tenantUploadsPath: string;
};

const slugPattern = /^[a-z][a-z0-9-]*$/;

export function resolveTenantUploads(
  tenant: Pick<TenantRecord, "slug" | "uploadsPath">,
  config: TenantUploadsConfig,
): TenantUploadsResolution {
  if (!slugPattern.test(tenant.slug)) throw new Error("TENANT_UPLOADS_SLUG_INVALID");
  const root = resolve(config.root);
  const configuredPath = tenant.uploadsPath.trim();
  const tenantUploadsPath = configuredPath
    ? resolve(configuredPath)
    : resolve(root, tenant.slug, "uploads");
  assertInsideRoot(root, tenantUploadsPath);
  return {
    publicPrefix: `/uploads/${tenant.slug}`,
    tenantUploadsPath,
  };
}

export async function ensureTenantUploadsPath(
  tenant: Pick<TenantRecord, "slug" | "uploadsPath">,
  config: TenantUploadsConfig,
): Promise<TenantUploadsResolution> {
  const resolved = resolveTenantUploads(tenant, config);
  await mkdir(resolved.tenantUploadsPath, { recursive: true });
  return resolved;
}

export function assertInsideRoot(rootPath: string, targetPath: string): void {
  const root = resolve(rootPath);
  const target = resolve(targetPath);
  if (target !== root && !target.startsWith(`${root}${sep}`)) throw new Error("TENANT_UPLOADS_PATH_OUTSIDE_ROOT");
}
