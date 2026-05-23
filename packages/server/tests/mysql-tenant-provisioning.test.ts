import {
  decryptTenantSecret,
  type ApiagexDatabase,
  type DatabaseStatement,
} from "@apiagex/database";
import { describe, expect, it } from "vitest";
import {
  buildMySqlTenantDatabaseNames,
  buildMySqlTenantDatabaseUrl,
  buildMySqlTenantUserNames,
  buildMySqlTenantUserUrl,
  mySqlAlterUserPasswordSql,
  mySqlCreateDatabaseSql,
  mySqlCreateUserSql,
  mySqlGrantDatabaseSql,
  provisionMySqlTenantDatabase,
  provisionMySqlTenantUser,
} from "../src/mysql-tenant-provisioning.js";

const secretKey = { key: Buffer.alloc(32, 11) };

describe("mysql tenant database provisioning", () => {
  it("builds safe mysql database names and SQL", () => {
    expect(buildMySqlTenantDatabaseNames("pizza-house")).toEqual({
      databaseName: "apiagex_pizza_house",
    });
    expect(buildMySqlTenantDatabaseNames("pizza-house", "tenant_")).toEqual({
      databaseName: "tenant_pizza_house",
    });
    expect(mySqlCreateDatabaseSql("tenant_pizza_house"))
      .toBe("CREATE DATABASE IF NOT EXISTS `tenant_pizza_house` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    expect(() => buildMySqlTenantDatabaseNames("../bad")).toThrow("TENANT_PROVISIONING_SLUG_INVALID");
  });

  it("replaces only the database name in the provisioning URL", () => {
    expect(buildMySqlTenantDatabaseUrl("mysql://localhost/mysql", "apiagex_pizza_house"))
      .toBe("mysql://localhost/apiagex_pizza_house");
  });

  it("builds safe tenant user names, URLs, and grant SQL", () => {
    expect(buildMySqlTenantUserNames("pizza-house")).toEqual({
      databaseName: "apiagex_pizza_house",
      username: "apiagex_pizza_house_user",
    });
    expect(buildMySqlTenantUserUrl(
      "mysql://admin@localhost/mysql",
      "apiagex_pizza_house",
      "apiagex_pizza_house_user",
      "tenant-password",
    )).toBe("mysql://apiagex_pizza_house_user:tenant-password@localhost/apiagex_pizza_house");
    expect(mySqlCreateUserSql("apiagex_pizza_house_user", "tenant-password"))
      .toBe("CREATE USER IF NOT EXISTS 'apiagex_pizza_house_user'@'%' IDENTIFIED BY 'tenant-password'");
    expect(mySqlAlterUserPasswordSql("apiagex_pizza_house_user", "tenant-password"))
      .toBe("ALTER USER 'apiagex_pizza_house_user'@'%' IDENTIFIED BY 'tenant-password'");
    expect(mySqlGrantDatabaseSql("apiagex_pizza_house", "apiagex_pizza_house_user"))
      .toBe("GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES ON `apiagex_pizza_house`.* TO 'apiagex_pizza_house_user'@'%'");
  });

  it("creates the database and opens the tenant DB for migrations", async () => {
    const admin = new MockDatabase("mysql");
    const tenant = new MockDatabase("mysql");

    const result = await provisionMySqlTenantDatabase(
      {
        provider: "mysql",
        provisioningDatabaseUrl: "mysql://localhost/mysql",
        secretKey,
        uploadsRoot: ".apiagex/uploads",
      },
      {
        actor: { source: "admin" },
        displayName: "Pizza House",
        provider: "mysql",
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

    expect(admin.execs).toEqual([
      "CREATE DATABASE IF NOT EXISTS `apiagex_pizza_house` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
    ]);
    expect(admin.closed).toBe(true);
    expect(tenant.openedUrl).toBe("mysql://localhost/apiagex_pizza_house");
    expect(tenant.closed).toBe(true);
    expect(decryptTenantSecret(result.encryptedDatabaseUrl, secretKey)).toBe("mysql://localhost/apiagex_pizza_house");
    expect(result.uploadsPath).toBe(".apiagex/uploads/pizza-house/uploads");
  });

  it("creates a limited tenant user and encrypts the tenant runtime URL", async () => {
    const admin = new MockDatabase("mysql");

    const result = await provisionMySqlTenantUser(
      {
        provider: "mysql",
        provisioningDatabaseUrl: "mysql://admin@localhost/mysql",
        secretKey,
        uploadsRoot: ".apiagex/uploads",
      },
      {
        actor: { source: "admin" },
        displayName: "Pizza House",
        provider: "mysql",
        slug: "pizza-house",
        tenantId: "tenant_1",
      },
      {
        generatePassword: () => "tenant-password",
        openAdminDatabase: async () => admin,
      },
    );

    expect(admin.execs).toEqual([
      "CREATE USER IF NOT EXISTS 'apiagex_pizza_house_user'@'%' IDENTIFIED BY 'tenant-password'",
      "ALTER USER 'apiagex_pizza_house_user'@'%' IDENTIFIED BY 'tenant-password'",
      "GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES ON `apiagex_pizza_house`.* TO 'apiagex_pizza_house_user'@'%'",
    ]);
    expect(admin.closed).toBe(true);
    expect(decryptTenantSecret(result.encryptedDatabaseUrl, secretKey))
      .toBe("mysql://apiagex_pizza_house_user:tenant-password@localhost/apiagex_pizza_house");
  });
});

class MockDatabase implements ApiagexDatabase {
  closed = false;
  execs: string[] = [];
  openedUrl = "";

  constructor(readonly provider: "mysql") {}

  async close(): Promise<void> {
    this.closed = true;
  }

  async exec(sql: string): Promise<void> {
    this.execs.push(sql);
  }

  prepare(_sql: string): DatabaseStatement {
    return {
      all: async () => [],
      get: async () => undefined,
      run: async () => ({ changes: 0 }),
    };
  }

  async transaction<TResult>(callback: () => Promise<TResult>): Promise<TResult> {
    return callback();
  }
}
