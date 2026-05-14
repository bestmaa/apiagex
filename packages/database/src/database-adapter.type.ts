export type DatabaseProvider = "sqlite" | "postgres" | "mysql";

export type DatabaseQueryParam = string | number | boolean | null | Buffer;

export type DatabaseRunResult = {
  changes: number;
};

export type DatabaseStatement = {
  get<TRecord = unknown>(...params: DatabaseQueryParam[]): Promise<TRecord | undefined>;
  all<TRecord = unknown>(...params: DatabaseQueryParam[]): Promise<TRecord[]>;
  run(...params: DatabaseQueryParam[]): Promise<DatabaseRunResult>;
};

export type ApiagexDatabase = {
  provider: DatabaseProvider;
  exec(sql: string): Promise<void>;
  prepare(sql: string): DatabaseStatement;
  transaction<TResult>(callback: () => Promise<TResult>): Promise<TResult>;
  close(): Promise<void>;
};
