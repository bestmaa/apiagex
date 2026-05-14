import mysql from "mysql2/promise";
import type { ApiagexDatabase, DatabaseQueryParam, DatabaseRunResult, DatabaseStatement } from "./database-adapter.type.js";
import { migrateProviderFoundation } from "./provider-migrations.js";

export type MySqlAdapterOptions = {
  migrate?: boolean;
};

export class MySqlApiagexDatabase implements ApiagexDatabase {
  readonly provider = "mysql";

  constructor(private readonly connection: mysql.Connection) {}

  async exec(sql: string): Promise<void> {
    for (const statement of splitMySqlStatements(sql)) {
      await this.connection.query(convertMySqlSql(statement));
    }
  }

  prepare(sql: string): DatabaseStatement {
    const queryText = convertMySqlSql(sql);
    return {
      get: async <TRecord = unknown>(...params: DatabaseQueryParam[]) => {
        const [rows] = await this.connection.query(queryText, params);
        return (Array.isArray(rows) ? rows[0] : undefined) as TRecord | undefined;
      },
      all: async <TRecord = unknown>(...params: DatabaseQueryParam[]) => {
        const [rows] = await this.connection.query(queryText, params);
        return (Array.isArray(rows) ? rows : []) as TRecord[];
      },
      run: async (...params: DatabaseQueryParam[]) => {
        const [result] = await this.connection.query<mysql.ResultSetHeader>(queryText, params);
        return toRunResult(result);
      },
    };
  }

  async transaction<TResult>(callback: () => Promise<TResult>): Promise<TResult> {
    await this.connection.beginTransaction();
    try {
      const result = await callback();
      await this.connection.commit();
      return result;
    } catch (error) {
      await this.connection.rollback();
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.connection.end();
  }
}

export async function openMySqlAdapter(
  connectionString: string | undefined,
  options: MySqlAdapterOptions = {},
): Promise<ApiagexDatabase> {
  if (!connectionString?.trim()) throw new Error("DATABASE_URL_REQUIRED: mysql");
  const connection = await mysql.createConnection(connectionString);
  const database = new MySqlApiagexDatabase(connection);
  if (options.migrate ?? true) await migrateProviderFoundation(database, "mysql");
  return database;
}

export function splitMySqlStatements(sql: string): string[] {
  return sql
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
}

export function quoteMySqlSchemaTable(sql: string): string {
  return sql.replace(/\bschemas\b/g, "`schemas`");
}

function convertMySqlSql(sql: string): string {
  return quoteMySqlSchemaTable(sql);
}

function toRunResult(result: mysql.ResultSetHeader): DatabaseRunResult {
  return { changes: result.affectedRows };
}
