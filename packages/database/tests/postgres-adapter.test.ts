import { describe, expect, it } from "vitest";
import {
  convertPostgresPlaceholders,
  createRole,
  listRoles,
  openPostgresAdapter,
  PostgresApiagexDatabase,
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

  it("serializes concurrent queries on the single pg client", async () => {
    let activeQueries = 0;
    let maxActiveQueries = 0;
    const client = {
      end: async () => undefined,
      query: async () => {
        activeQueries += 1;
        maxActiveQueries = Math.max(maxActiveQueries, activeQueries);
        await delay(5);
        activeQueries -= 1;
        return { rows: [], rowCount: 0 };
      },
    };
    const db = new PostgresApiagexDatabase(client as never);
    const statement = db.prepare("SELECT * FROM roles WHERE id = ?");

    await Promise.all([
      statement.all("role-1"),
      statement.get("role-2"),
      statement.run("role-3"),
      db.exec("SELECT 1"),
    ]);

    expect(maxActiveQueries).toBe(1);
  });

  it("keeps outside queries behind an active transaction", async () => {
    const queries: string[] = [];
    const client = {
      end: async () => undefined,
      query: async (sql: string) => {
        queries.push(sql);
        await delay(5);
        return { rows: [], rowCount: 0 };
      },
    };
    const db = new PostgresApiagexDatabase(client as never);
    const statement = db.prepare("SELECT * FROM roles WHERE id = ?");

    await Promise.all([
      db.transaction(async () => {
        await Promise.all([
          statement.run("inside-1"),
          statement.run("inside-2"),
        ]);
      }),
      statement.run("outside"),
    ]);

    expect(queries).toEqual([
      "BEGIN",
      "SELECT * FROM roles WHERE id = $1",
      "SELECT * FROM roles WHERE id = $1",
      "COMMIT",
      "SELECT * FROM roles WHERE id = $1",
    ]);
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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
