export type ServerConfigEnv = Partial<Record<string, string | undefined>>;

export type DatabaseProvider = "sqlite" | "postgres" | "mysql";

export type LocalServerConfig = {
  appSecret?: string;
  databaseUrl?: string;
  databasePath: string;
  databaseProvider: DatabaseProvider;
  multiTenant?: {
    enabled: boolean;
    pathPrefix?: string | undefined;
    platformDatabaseProvider: DatabaseProvider;
    platformDatabaseUrl: string;
    rootDomain?: string | undefined;
    secretKeyBase64: string;
  } | undefined;
  uploadsPath: string;
};
