import { constants } from "node:fs";
import { access, stat } from "node:fs/promises";
import type { ApiagexDatabase, DatabaseProvider, TenantRecord } from "@apiagex/database";

export type TenantHealthStatus = "ok" | "error";

export type TenantHealthTenantSummary = {
  id: string;
  provider: DatabaseProvider;
  slug: string;
  status: TenantRecord["status"];
};

export type TenantHealthCheck = {
  ok: boolean;
  status: TenantHealthStatus;
};

export type TenantDatabaseHealthCheck = TenantHealthCheck & {
  provider: DatabaseProvider;
};

export type TenantUploadsHealthCheck = TenantHealthCheck & {
  configured: boolean;
};

export type TenantHealthDiagnostics = {
  ok: boolean;
  checks: {
    database: TenantDatabaseHealthCheck;
    uploads: TenantUploadsHealthCheck;
  };
  tenant: TenantHealthTenantSummary | null;
};

export type TenantHealthDiagnosticsInput = {
  database: ApiagexDatabase;
  tenant?: Pick<TenantRecord, "databaseProvider" | "id" | "slug" | "status"> | null;
  uploadsPath?: string | undefined;
};

export async function buildTenantHealthDiagnostics(
  input: TenantHealthDiagnosticsInput,
): Promise<TenantHealthDiagnostics> {
  const [database, uploads] = await Promise.all([
    checkTenantDatabase(input.database),
    checkTenantUploads(input.uploadsPath),
  ]);
  return {
    ok: database.ok && uploads.ok,
    checks: { database, uploads },
    tenant: input.tenant
      ? {
          id: input.tenant.id,
          provider: input.tenant.databaseProvider,
          slug: input.tenant.slug,
          status: input.tenant.status,
        }
      : null,
  };
}

export async function checkTenantDatabase(db: ApiagexDatabase): Promise<TenantDatabaseHealthCheck> {
  try {
    await db.prepare("SELECT 1 AS ok").get();
    return { ok: true, provider: db.provider, status: "ok" };
  } catch {
    return { ok: false, provider: db.provider, status: "error" };
  }
}

export async function checkTenantUploads(uploadsPath: string | undefined): Promise<TenantUploadsHealthCheck> {
  if (!uploadsPath) return { configured: false, ok: true, status: "ok" };
  try {
    const stats = await stat(uploadsPath);
    await access(uploadsPath, constants.R_OK | constants.W_OK);
    return { configured: true, ok: stats.isDirectory(), status: stats.isDirectory() ? "ok" : "error" };
  } catch {
    return { configured: true, ok: false, status: "error" };
  }
}
