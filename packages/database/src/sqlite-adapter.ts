import type { ApiagexDatabase, DatabaseQueryParam, DatabaseRunResult, DatabaseStatement } from "./database-adapter.type.js";
import { migrateMvpDatabase, openSqliteDatabase, type SqliteDatabase } from "./sqlite.js";

export class SqliteApiagexDatabase implements ApiagexDatabase {
  readonly provider = "sqlite";

  constructor(private readonly db: SqliteDatabase) {}

  async exec(sql: string): Promise<void> {
    this.db.exec(sql);
  }

  prepare(sql: string): DatabaseStatement {
    const statement = this.db.prepare(sql);
    return {
      get: async <TRecord = unknown>(...params: DatabaseQueryParam[]) => statement.get(...params) as TRecord | undefined,
      all: async <TRecord = unknown>(...params: DatabaseQueryParam[]) => statement.all(...params) as TRecord[],
      run: async (...params: DatabaseQueryParam[]) => toRunResult(statement.run(...params)),
    };
  }

  async transaction<TResult>(callback: () => Promise<TResult>): Promise<TResult> {
    this.db.exec("BEGIN");
    try {
      const result = await callback();
      this.db.exec("COMMIT");
      return result;
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  async close(): Promise<void> {
    this.db.close();
  }
}

export function openSqliteAdapter(path = ":memory:"): ApiagexDatabase {
  return new SqliteApiagexDatabase(openSqliteDatabase(path));
}

export function openMigratedSqliteAdapter(path = ":memory:"): ApiagexDatabase {
  const db = openSqliteDatabase(path);
  migrateMvpDatabase(db);
  return new SqliteApiagexDatabase(db);
}

export function wrapSqliteDatabase(db: SqliteDatabase): ApiagexDatabase {
  return new SqliteApiagexDatabase(db);
}

function toRunResult(result: { changes: number }): DatabaseRunResult {
  return { changes: result.changes };
}
