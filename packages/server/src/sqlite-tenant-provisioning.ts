import { mkdir } from "node:fs/promises";
import { resolve, sep } from "node:path";
import {
  encryptTenantSecret,
  openMigratedSqliteAdapter,
} from "@apiagex/database";
import { bootstrapTenantOwner } from "./tenant-owner-bootstrap.js";
import type {
  SqliteTenantProvisioningConfig,
  TenantProvisioner,
  TenantProvisioningContext,
  TenantProvisioningResult,
  TenantProvisioningStepId,
  TenantProvisioningStepStatus,
} from "./tenant-provisioning.type.js";
import { createTenantProvisioningPlan } from "./tenant-provisioning.type.js";

const slugPattern = /^[a-z][a-z0-9-]*$/;

export const sqliteTenantProvisioner: TenantProvisioner = {
  plan(config, _request) {
    assertSqliteConfig(config);
    return createTenantProvisioningPlan(config.provider);
  },
  async provision(config, context) {
    assertSqliteConfig(config);
    return provisionSqliteTenant(config, context);
  },
};

export async function provisionSqliteTenant(
  config: SqliteTenantProvisioningConfig,
  context: TenantProvisioningContext,
): Promise<TenantProvisioningResult> {
  if (context.request.provider !== "sqlite") throw new Error("TENANT_PROVISIONING_PROVIDER_MISMATCH");
  const paths = resolveSqliteTenantProvisioningPaths(config, context.request.slug);

  await emit(context, "reserveTenant", "completed");
  await emit(context, "createDatabase", "running");
  await mkdir(paths.databaseDir, { recursive: true });
  const db = openMigratedSqliteAdapter(paths.databasePath);
  await emit(context, "createDatabase", "completed");

  await emit(context, "createDatabaseUser", "skipped");
  await emit(context, "runTenantMigrations", "completed");

  try {
    await emit(context, "createUploadsPath", "running");
    await mkdir(paths.uploadsPath, { recursive: true });
    await emit(context, "createUploadsPath", "completed");

    if (context.request.owner) {
      await emit(context, "bootstrapOwner", "running");
      const ownerResult = await bootstrapTenantOwner(db, context.request.owner);
      await emit(context, "bootstrapOwner", ownerResult.created ? "completed" : "skipped");
    } else {
      await emit(context, "bootstrapOwner", "skipped");
    }

    await emit(context, "activateTenant", "completed");
    return {
      encryptedDatabaseUrl: encryptTenantSecret(`file:${paths.databasePath}`, config.secretKey),
      provider: "sqlite",
      tenantId: context.request.tenantId,
      uploadsPath: paths.uploadsPath,
    };
  } finally {
    await db.close();
  }
}

export type SqliteTenantProvisioningPaths = {
  databaseDir: string;
  databasePath: string;
  uploadsPath: string;
};

export function resolveSqliteTenantProvisioningPaths(
  config: Pick<SqliteTenantProvisioningConfig, "tenantDatabasesRoot" | "uploadsRoot">,
  slug: string,
): SqliteTenantProvisioningPaths {
  if (!slugPattern.test(slug)) throw new Error("TENANT_PROVISIONING_SLUG_INVALID");
  const databaseRoot = resolve(config.tenantDatabasesRoot);
  const uploadsRoot = resolve(config.uploadsRoot);
  const databaseDir = resolve(databaseRoot, slug);
  const databasePath = resolve(databaseDir, "apiagex.sqlite");
  const uploadsPath = resolve(uploadsRoot, slug, "uploads");
  assertInsideRoot(databaseRoot, databasePath, "TENANT_PROVISIONING_DATABASE_PATH_OUTSIDE_ROOT");
  assertInsideRoot(uploadsRoot, uploadsPath, "TENANT_PROVISIONING_UPLOADS_PATH_OUTSIDE_ROOT");
  return { databaseDir, databasePath, uploadsPath };
}

function assertSqliteConfig(config: unknown): asserts config is SqliteTenantProvisioningConfig {
  if (!config || typeof config !== "object" || (config as { provider?: unknown }).provider !== "sqlite") {
    throw new Error("TENANT_PROVISIONING_SQLITE_CONFIG_REQUIRED");
  }
}

function assertInsideRoot(rootPath: string, targetPath: string, errorCode: string): void {
  const root = resolve(rootPath);
  const target = resolve(targetPath);
  if (target !== root && !target.startsWith(`${root}${sep}`)) throw new Error(errorCode);
}

async function emit(
  context: TenantProvisioningContext,
  step: TenantProvisioningStepId,
  status: TenantProvisioningStepStatus,
): Promise<void> {
  await context.emit?.({ step, status, tenantId: context.request.tenantId });
}
