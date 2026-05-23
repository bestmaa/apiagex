import {
  decryptTenantSecret,
  type ApiagexDatabase,
  type DatabaseQueryParam,
  type DatabaseStatement,
} from "@apiagex/database";
import { describe, expect, it } from "vitest";
import {
  buildPostgresTenantDatabaseNames,
  buildPostgresTenantDatabaseUrl,
  buildPostgresTenantUserNames,
  buildPostgresTenantUserUrl,
  postgresAlterRolePasswordSql,
  postgresCreateDatabaseSql,
  postgresCreateRoleSql,
  postgresGrantDatabaseSql,
  postgresGrantTenantSchemaSql,
  provisionPostgresTenantDatabase,
  provisionPostgresTenantUser,
} from "../src/postgres-tenant-provisioning.js";

const secretKey = { key: Buffer.alloc(32, 9) };

describe("postgres tenant database provisioning", () => {
  it("builds safe postgres database names and SQL", () => {
    expect(buildPostgresTenantDatabaseNames("pizza-house")).toEqual({
      databaseName: "apiagex_pizza_house",
    });
    expect(buildPostgresTenantDatabaseNames("pizza-house", "tenant_")).toEqual({
      databaseName: "tenant_pizza_house",
    });
    expect(postgresCreateDatabaseSql("tenant_pizza_house")).toBe('CREATE DATABASE "tenant_pizza_house"');
    expect(() => buildPostgresTenantDatabaseNames("../bad")).toThrow("TENANT_PROVISIONING_SLUG_INVALID");
  });

  it("replaces only the database name in the provisioning URL", () => {
    expect(buildPostgresTenantDatabaseUrl("postgres://localhost/postgres", "apiagex_pizza_house"))
      .toBe("postgres://localhost/apiagex_pizza_house");
  });

  it("builds safe tenant user names, URLs, and role SQL", () => {
    expect(buildPostgresTenantUserNames("pizza-house")).toEqual({
      databaseName: "apiagex_pizza_house",
      username: "apiagex_pizza_house_user",
    });
    expect(buildPostgresTenantUserUrl(
      "postgres://admin@localhost/postgres",
      "apiagex_pizza_house",
      "apiagex_pizza_house_user",
      "tenant-password",
    )).toBe("postgres://apiagex_pizza_house_user:tenant-password@localhost/apiagex_pizza_house");
    expect(postgresCreateRoleSql("apiagex_pizza_house_user", "tenant-password"))
      .toBe('CREATE ROLE "apiagex_pizza_house_user" LOGIN PASSWORD \'tenant-password\'');
    expect(postgresAlterRolePasswordSql("apiagex_pizza_house_user", "tenant-password"))
      .toBe('ALTER ROLE "apiagex_pizza_house_user" WITH PASSWORD \'tenant-password\'');
    expect(postgresGrantDatabaseSql("apiagex_pizza_house", "apiagex_pizza_house_user"))
      .toContain('GRANT CONNECT ON DATABASE "apiagex_pizza_house" TO "apiagex_pizza_house_user"');
    expect(postgresGrantTenantSchemaSql("apiagex_pizza_house_user")).toContain(
      'GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO "apiagex_pizza_house_user"',
    );
  });

  it("creates the database when missing and opens the tenant DB for migrations", async () => {
    const admin = new MockDatabase("postgres");
    const tenant = new MockDatabase("postgres");

    const result = await provisionPostgresTenantDatabase(
      {
        provider: "postgres",
        provisioningDatabaseUrl: "postgres://localhost/postgres",
        secretKey,
        uploadsRoot: ".apiagex/uploads",
      },
      {
        actor: { source: "admin" },
        displayName: "Pizza House",
        provider: "postgres",
        slug: "pizza-house",
        tenantId: "tenant_1",
      },
      {
        openAdminDatabase: async () => admin,
        openTenantDatabase: async (url) => {
          tenant.openedUrl = url;
          return tenant;
        },
      },
    );

    expect(admin.execs).toEqual(['CREATE DATABASE "apiagex_pizza_house"']);
    expect(admin.closed).toBe(true);
    expect(tenant.openedUrl).toBe("postgres://localhost/apiagex_pizza_house");
    expect(tenant.closed).toBe(true);
    expect(decryptTenantSecret(result.encryptedDatabaseUrl, secretKey))
      .toBe("postgres://localhost/apiagex_pizza_house");
    expect(result.uploadsPath).toBe(".apiagex/uploads/pizza-house/uploads");
  });

  it("does not recreate an existing tenant database", async () => {
    const admin = new MockDatabase("postgres", true);
    const tenant = new MockDatabase("postgres");

    await provisionPostgresTenantDatabase(
      {
        provider: "postgres",
        provisioningDatabaseUrl: "postgres://localhost/postgres",
        secretKey,
        uploadsRoot: ".apiagex/uploads",
      },
      {
        actor: { source: "admin" },
        displayName: "Pizza House",
        provider: "postgres",
        slug: "pizza-house",
        tenantId: "tenant_1",
      },
      {
        openAdminDatabase: async () => admin,
        openTenantDatabase: async () => tenant,
      },
    );

    expect(admin.execs).toEqual([]);
  });

  it("creates a limited tenant user and encrypts the tenant runtime URL", async () => {
    const admin = new MockDatabase("postgres");
    const tenantAdmin = new MockDatabase("postgres");

    const result = await provisionPostgresTenantUser(
      {
        provider: "postgres",
        provisioningDatabaseUrl: "postgres://admin@localhost/postgres",
        secretKey,
        uploadsRoot: ".apiagex/uploads",
      },
      {
        actor: { source: "admin" },
        displayName: "Pizza House",
        provider: "postgres",
        slug: "pizza-house",
        tenantId: "tenant_1",
      },
      {
        generatePassword: () => "tenant-password",
        openAdminDatabase: async () => admin,
        openTenantAdminDatabase: async (url) => {
          tenantAdmin.openedUrl = url;
          return tenantAdmin;
        },
      },
    );

    expect(admin.execs).toEqual([
      'CREATE ROLE "apiagex_pizza_house_user" LOGIN PASSWORD \'tenant-password\'',
      [
        'GRANT CONNECT ON DATABASE "apiagex_pizza_house" TO "apiagex_pizza_house_user"',
        'GRANT ALL PRIVILEGES ON DATABASE "apiagex_pizza_house" TO "apiagex_pizza_house_user"',
      ].join(";\n"),
    ]);
    expect(tenantAdmin.openedUrl).toBe("postgres://admin@localhost/apiagex_pizza_house");
    expect(tenantAdmin.execs).toEqual(postgresGrantTenantSchemaSql("apiagex_pizza_house_user"));
    expect(decryptTenantSecret(result.encryptedDatabaseUrl, secretKey))
      .toBe("postgres://apiagex_pizza_house_user:tenant-password@localhost/apiagex_pizza_house");
  });

  it("rotates the password when the tenant role already exists", async () => {
    const admin = new MockDatabase("postgres", true);
    const tenantAdmin = new MockDatabase("postgres");

    await provisionPostgresTenantUser(
      {
        provider: "postgres",
        provisioningDatabaseUrl: "postgres://admin@localhost/postgres",
        secretKey,
        uploadsRoot: ".apiagex/uploads",
      },
      {
        actor: { source: "admin" },
        displayName: "Pizza House",
        provider: "postgres",
        slug: "pizza-house",
        tenantId: "tenant_1",
      },
      {
        generatePassword: () => "new-password",
        openAdminDatabase: async () => admin,
        openTenantAdminDatabase: async () => tenantAdmin,
      },
    );

    expect(admin.execs[0]).toBe('ALTER ROLE "apiagex_pizza_house_user" WITH PASSWORD \'new-password\'');
  });
});

class MockDatabase implements ApiagexDatabase {
  closed = false;
  execs: string[] = [];
  openedUrl = "";

  constructor(
    readonly provider: "postgres",
    private readonly databaseExists = false,
  ) {}

  async close(): Promise<void> {
    this.closed = true;
  }

  async exec(sql: string): Promise<void> {
    this.execs.push(sql);
  }

  prepare(_sql: string): DatabaseStatement {
    return {
      all: async () => [],
      get: async <TRecord = unknown>(_databaseName?: DatabaseQueryParam) => (
        this.databaseExists ? { exists: 1 } : undefined
      ) as TRecord | undefined,
      run: async () => ({ changes: 0 }),
    };
  }

  async transaction<TResult>(callback: () => Promise<TResult>): Promise<TResult> {
    return callback();
  }
}
