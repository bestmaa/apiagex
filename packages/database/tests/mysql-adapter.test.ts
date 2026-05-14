import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  createRole,
  listRoles,
  openMySqlAdapter,
  splitMySqlStatements,
} from "../src/index.js";

describe("MySQL adapter", () => {
  it("splits migration SQL into executable statements", () => {
    expect(splitMySqlStatements("CREATE TABLE a (id INT); \n CREATE TABLE b (id INT);")).toEqual([
      "CREATE TABLE a (id INT)",
      "CREATE TABLE b (id INT)",
    ]);
  });

  it("requires a connection URL", async () => {
    await expect(openMySqlAdapter(undefined, { migrate: false })).rejects.toThrow("DATABASE_URL_REQUIRED: mysql");
  });

  it.runIf(process.env.APIAGEX_TEST_MYSQL_URL)("runs repositories against MySQL", async () => {
    const db = await openMySqlAdapter(process.env.APIAGEX_TEST_MYSQL_URL);
    try {
      const roleName = `mysql-reader-${randomUUID()}`;
      const role = await createRole(db, { description: "MySQL integration role", name: roleName });
      const roles = await listRoles(db);

      expect(role.name).toBe(roleName);
      expect(roles.some((item) => item.id === role.id)).toBe(true);
    } finally {
      await db.close();
    }
  });
});
