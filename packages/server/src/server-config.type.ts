export type ServerConfigEnv = Partial<Record<string, string | undefined>>;

export type LocalServerConfig = {
  databasePath: string;
  uploadsPath: string;
};
