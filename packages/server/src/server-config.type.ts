export type ServerConfigEnv = Partial<Record<string, string | undefined>>;

export type DatabaseProvider = "sqlite";

export type LocalServerConfig = {
  appSecret?: string;
  databasePath: string;
  databaseProvider: DatabaseProvider;
  uploadsPath: string;
};
