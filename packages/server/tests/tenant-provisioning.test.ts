import { describe, expect, it } from "vitest";
import {
  createTenantProvisioningPlan,
  tenantProvisioningStepIds,
  type TenantProvisioningConfig,
  type TenantProvisioningRequest,
} from "../src/tenant-provisioning.type.js";

describe("tenant provisioning contract", () => {
  it("defines a stable ordered provisioning plan", () => {
    expect(tenantProvisioningStepIds).toEqual([
      "reserveTenant",
      "createDatabase",
      "createDatabaseUser",
      "runTenantMigrations",
      "createUploadsPath",
      "bootstrapOwner",
      "activateTenant",
    ]);
  });

  it("marks database user creation as sqlite-only skipped work", () => {
    const sqlite = createTenantProvisioningPlan("sqlite");
    const postgres = createTenantProvisioningPlan("postgres");
    const mysql = createTenantProvisioningPlan("mysql");

    expect(sqlite.steps.find((step) => step.id === "createDatabaseUser")).toMatchObject({
      required: false,
      status: "skipped",
    });
    expect(postgres.steps.find((step) => step.id === "createDatabaseUser")).toMatchObject({
      required: true,
      status: "pending",
    });
    expect(mysql.steps.find((step) => step.id === "createDatabaseUser")).toMatchObject({
      required: true,
      status: "pending",
    });
  });

  it("keeps provider config and request shapes explicit", () => {
    const secretKey = { key: Buffer.alloc(32, 1) };
    const configs: TenantProvisioningConfig[] = [
      {
        provider: "sqlite",
        secretKey,
        tenantDatabasesRoot: ".apiagex/tenants",
        uploadsRoot: ".apiagex/uploads",
      },
      {
        provider: "postgres",
        provisioningDatabaseUrl: "postgres://localhost/postgres",
        secretKey,
        uploadsRoot: ".apiagex/uploads",
      },
      {
        provider: "mysql",
        provisioningDatabaseUrl: "mysql://localhost/mysql",
        secretKey,
        uploadsRoot: ".apiagex/uploads",
      },
    ];
    const request: TenantProvisioningRequest = {
      actor: { source: "automation" },
      displayName: "Pizza House",
      owner: { email: "owner@example.com", passwordHash: "hash" },
      provider: "sqlite",
      slug: "pizza-house",
      tenantId: "tenant_1",
    };

    expect(configs.map((config) => config.provider)).toEqual(["sqlite", "postgres", "mysql"]);
    expect(request.owner).toMatchObject({ email: "owner@example.com" });
  });
});
