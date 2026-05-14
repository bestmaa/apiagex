import { Client } from "pg";
import type { ApiagexDatabase, DatabaseQueryParam, DatabaseRunResult, DatabaseStatement } from "./database-adapter.type.js";
import { migrateProviderFoundation } from "./provider-migrations.js";

export type PostgresAdapterOptions = {
  migrate?: boolean;
};

export class PostgresApiagexDatabase implements ApiagexDatabase {
  readonly provider = "postgres";

  constructor(private readonly client: Client) {}

  async exec(sql: string): Promise<void> {
    await this.client.query(sql);
  }

  prepare(sql: string): DatabaseStatement {
    const queryText = convertPostgresPlaceholders(sql);
    return {
      get: async <TRecord = unknown>(...params: DatabaseQueryParam[]) => {
        const result = await this.client.query(queryText, params);
        return result.rows[0] as TRecord | undefined;
      },
      all: async <TRecord = unknown>(...params: DatabaseQueryParam[]) => {
        const result = await this.client.query(queryText, params);
        return result.rows as TRecord[];
      },
      run: async (...params: DatabaseQueryParam[]) => {
        const result = await this.client.query(queryText, params);
        return toRunResult(result.rowCount);
      },
    };
  }

  async transaction<TResult>(callback: () => Promise<TResult>): Promise<TResult> {
    await this.client.query("BEGIN");
    try {
      const result = await callback();
      await this.client.query("COMMIT");
      return result;
    } catch (error) {
      await this.client.query("ROLLBACK");
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.client.end();
  }
}

export async function openPostgresAdapter(
  connectionString: string | undefined,
  options: PostgresAdapterOptions = {},
): Promise<ApiagexDatabase> {
  if (!connectionString?.trim()) throw new Error("DATABASE_URL_REQUIRED: postgres");
  const client = new Client({ connectionString });
  await client.connect();
  const database = new PostgresApiagexDatabase(client);
  if (options.migrate ?? true) await migrateProviderFoundation(database, "postgres");
  return database;
}

export function convertPostgresPlaceholders(sql: string): string {
  let index = 0;
  return sql.replaceAll("?", () => `$${++index}`);
}

function toRunResult(rowCount: number | null): DatabaseRunResult {
  return { changes: rowCount ?? 0 };
}
