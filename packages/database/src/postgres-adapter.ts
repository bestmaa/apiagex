import { AsyncLocalStorage } from "node:async_hooks";
import { Client } from "pg";
import type { ApiagexDatabase, DatabaseQueryParam, DatabaseRunResult, DatabaseStatement } from "./database-adapter.type.js";
import { migrateProviderFoundation } from "./provider-migrations.js";

export type PostgresAdapterOptions = {
  migrate?: boolean;
};

type QueryQueue = {
  current: Promise<unknown>;
};

export class PostgresApiagexDatabase implements ApiagexDatabase {
  readonly provider = "postgres";
  private readonly transactionContext = new AsyncLocalStorage<QueryQueue>();
  private readonly queryQueue: QueryQueue = { current: Promise.resolve() };

  constructor(private readonly client: Client) {}

  async exec(sql: string): Promise<void> {
    await this.runSerialized(() => this.client.query(sql));
  }

  prepare(sql: string): DatabaseStatement {
    const queryText = convertPostgresSql(sql);
    return {
      get: async <TRecord = unknown>(...params: DatabaseQueryParam[]) => {
        const result = await this.runSerialized(() => this.client.query(queryText, params));
        return result.rows[0] as TRecord | undefined;
      },
      all: async <TRecord = unknown>(...params: DatabaseQueryParam[]) => {
        const result = await this.runSerialized(() => this.client.query(queryText, params));
        return result.rows as TRecord[];
      },
      run: async (...params: DatabaseQueryParam[]) => {
        const result = await this.runSerialized(() => this.client.query(queryText, params));
        return toRunResult(result.rowCount);
      },
    };
  }

  async transaction<TResult>(callback: () => Promise<TResult>): Promise<TResult> {
    return this.runSerialized(() => this.transactionContext.run({ current: Promise.resolve() }, async () => {
      await this.client.query("BEGIN");
      try {
        const result = await callback();
        await this.client.query("COMMIT");
        return result;
      } catch (error) {
        await this.client.query("ROLLBACK");
        throw error;
      }
    }));
  }

  async close(): Promise<void> {
    await this.runSerialized(() => this.client.end());
  }

  private async runSerialized<TResult>(operation: () => Promise<TResult>): Promise<TResult> {
    const queue = this.transactionContext.getStore() ?? this.queryQueue;
    const next = queue.current.then(operation, operation);
    queue.current = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
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

export function quotePostgresCamelCaseAliases(sql: string): string {
  return sql.replace(/\bas\s+([a-z][A-Za-z0-9]*[A-Z][A-Za-z0-9]*)\b/g, 'as "$1"');
}

function convertPostgresSql(sql: string): string {
  return convertPostgresPlaceholders(quotePostgresCamelCaseAliases(sql));
}

function toRunResult(rowCount: number | null): DatabaseRunResult {
  return { changes: rowCount ?? 0 };
}
