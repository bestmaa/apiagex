export type ServerConfigEnv = Partial<Record<string, string | undefined>>;

export type DatabaseProvider = "sqlite" | "postgres" | "mysql";

export type LocalServerConfig = {
  appSecret?: string;
  databaseUrl?: string;
  databasePath: string;
  databaseProvider: DatabaseProvider;
  uploadsPath: string;
};
