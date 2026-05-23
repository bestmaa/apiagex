import {
  recordTenantAuditEvent,
  updateTenant,
  type ApiagexDatabase,
  type TenantAuditEventRecord,
  type TenantRecord,
} from "@apiagex/database";
import type { TenantProvisioningActor } from "./tenant-provisioning.type.js";

export type TenantProvisioningFailureResult = {
  auditEvent: TenantAuditEventRecord;
  cleanup: "not_attempted";
  tenant: TenantRecord;
};

export async function markTenantProvisioningFailed(
  platformDb: ApiagexDatabase,
  input: {
    actor: TenantProvisioningActor;
    error: unknown;
    tenantId: string;
  },
): Promise<TenantProvisioningFailureResult> {
  const tenant = await updateTenant(platformDb, input.tenantId, {
    status: "failed",
  });
  const auditEvent = await recordTenantAuditEvent(platformDb, {
    action: "tenant.provisioning.failed",
    actorId: input.actor.id,
    metadata: {
      actorType: input.actor.source,
      cleanup: "not_attempted",
      error: sanitizedProvisioningError(input.error),
    },
    tenantId: input.tenantId,
  });
  return {
    auditEvent,
    cleanup: "not_attempted",
    tenant,
  };
}

export function sanitizedProvisioningError(error: unknown): string {
  if (!(error instanceof Error)) return "TENANT_PROVISIONING_FAILED";
  if (!error.message.trim()) return "TENANT_PROVISIONING_FAILED";
  const message = redactTenantSecretText(error.message);
  return message.length > 160 ? `${message.slice(0, 157)}...` : message;
}

export function redactTenantSecretText(value: string): string {
  return value
    .replace(/:\/\/[^@\s/]+@/g, "://***@")
    .replace(/\b(databaseUrl|encryptedDatabaseUrl|password|secret|token|apiKey|api_key)=([^\s&]+)/gi, "$1=***")
    .replace(/"((?:encrypted_)?database_url|databaseUrl|encryptedDatabaseUrl|password|secret|token|apiKey|api_key)"\s*:\s*"[^"]*"/gi, "\"$1\":\"***\"");
}
