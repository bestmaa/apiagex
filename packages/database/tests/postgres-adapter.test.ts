import { describe, expect, it } from "vitest";
import {
  convertPostgresPlaceholders,
  createRole,
  listRoles,
  openPostgresAdapter,
  quotePostgresCamelCaseAliases,
} from "../src/index.js";

describe("PostgreSQL adapter", () => {
  it("converts sqlite-style placeholders to PostgreSQL positional parameters", () => {
    expect(convertPostgresPlaceholders("SELECT * FROM entries WHERE id = ? AND schema_id = ?")).toBe(
      "SELECT * FROM entries WHERE id = $1 AND schema_id = $2",
    );
  });

  it("quotes camelCase aliases so PostgreSQL returns repository field names", () => {
    expect(quotePostgresCamelCaseAliases("SELECT role_kind as roleKind, created_at as createdAt FROM roles")).toBe(
      'SELECT role_kind as "roleKind", created_at as "createdAt" FROM roles',
    );
  });

  it("requires a PostgreSQL database URL", async () => {
    await expect(openPostgresAdapter(undefined)).rejects.toThrow("DATABASE_URL_REQUIRED: postgres");
  });

  it.runIf(process.env.APIAGEX_TEST_POSTGRES_URL)("runs repository calls against real PostgreSQL", async () => {
    const db = await openPostgresAdapter(process.env.APIAGEX_TEST_POSTGRES_URL);
    try {
      const role = await createRole(db, { name: `pg-reader-${Date.now()}` });
      expect(role.roleKind).toBe("api");
      expect((await listRoles(db)).some((item) => item.id === role.id)).toBe(true);
    } finally {
      await db.close();
    }
  });
});
