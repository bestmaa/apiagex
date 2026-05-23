import type { DatabaseProvider, TenantEncryptedSecret, TenantSecretKey } from "@apiagex/database";

export type TenantProvisioningStepId =
  | "reserveTenant"
  | "createDatabase"
  | "createDatabaseUser"
  | "runTenantMigrations"
  | "createUploadsPath"
  | "bootstrapOwner"
  | "activateTenant";

export type TenantProvisioningStepStatus = "pending" | "running" | "completed" | "skipped" | "failed";

export type TenantProvisioningStep = {
  id: TenantProvisioningStepId;
  required: boolean;
  status: TenantProvisioningStepStatus;
};

export type TenantProvisioningActor = {
  id?: string | undefined;
  source: "admin" | "automation" | "system";
};

export type TenantProvisioningOwnerInput = {
  email: string;
  name?: string | undefined;
  passwordHash?: string | undefined;
  password?: string | undefined;
};

export type TenantProvisioningRequest = {
  actor: TenantProvisioningActor;
  displayName: string;
  owner?: TenantProvisioningOwnerInput | undefined;
  provider: DatabaseProvider;
  slug: string;
  tenantId: string;
};

export type SqliteTenantProvisioningConfig = {
  provider: "sqlite";
  secretKey: TenantSecretKey;
  tenantDatabasesRoot: string;
  uploadsRoot: string;
};

export type PostgresTenantProvisioningConfig = {
  databaseNamePrefix?: string | undefined;
  provider: "postgres";
  provisioningDatabaseUrl: string;
  secretKey: TenantSecretKey;
  tenantUsernamePrefix?: string | undefined;
  uploadsRoot: string;
};

export type MySqlTenantProvisioningConfig = {
  databaseNamePrefix?: string | undefined;
  provider: "mysql";
  provisioningDatabaseUrl: string;
  secretKey: TenantSecretKey;
  tenantUsernamePrefix?: string | undefined;
  uploadsRoot: string;
};

export type TenantProvisioningConfig =
  | SqliteTenantProvisioningConfig
  | PostgresTenantProvisioningConfig
  | MySqlTenantProvisioningConfig;

export type TenantProvisioningPlan = {
  provider: DatabaseProvider;
  steps: TenantProvisioningStep[];
};

export type TenantProvisioningResult = {
  encryptedDatabaseUrl: TenantEncryptedSecret;
  provider: DatabaseProvider;
  tenantId: string;
  uploadsPath: string;
};

export type TenantProvisioningProgressEvent = {
  metadata?: Record<string, string | number | boolean | null> | undefined;
  step: TenantProvisioningStepId;
  status: TenantProvisioningStepStatus;
  tenantId: string;
};

export type TenantProvisioningContext = {
  emit?: ((event: TenantProvisioningProgressEvent) => void | Promise<void>) | undefined;
  request: TenantProvisioningRequest;
};

export type TenantProvisioner = {
  plan(config: TenantProvisioningConfig, request: TenantProvisioningRequest): TenantProvisioningPlan;
  provision(config: TenantProvisioningConfig, context: TenantProvisioningContext): Promise<TenantProvisioningResult>;
  rollback?(
    config: TenantProvisioningConfig,
    context: TenantProvisioningContext,
    error: unknown,
  ): Promise<void>;
};

export const tenantProvisioningStepIds: TenantProvisioningStepId[] = [
  "reserveTenant",
  "createDatabase",
  "createDatabaseUser",
  "runTenantMigrations",
  "createUploadsPath",
  "bootstrapOwner",
  "activateTenant",
];

export function createTenantProvisioningPlan(provider: DatabaseProvider): TenantProvisioningPlan {
  return {
    provider,
    steps: tenantProvisioningStepIds.map((id) => ({
      id,
      required: provider === "sqlite" ? id !== "createDatabaseUser" : true,
      status: provider === "sqlite" && id === "createDatabaseUser" ? "skipped" : "pending",
    })),
  };
}
