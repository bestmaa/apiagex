import type { LocalServerConfig, ServerConfigEnv } from "./server-config.type.js";
import type { ApiagexServer } from "./app.type.js";

export type RuntimeCliResult = {
  code: number;
  stderr: string;
  stdout: string;
};

export type RuntimeCliOptions = {
  cwd?: string;
  env?: ServerConfigEnv;
};

export type InitialOwnerOptions = {
  email: string;
  password: string;
};

export type StartServerOptions = {
  config?: LocalServerConfig;
  cwd?: string;
  env?: ServerConfigEnv;
  host?: string;
  initialOwner?: InitialOwnerOptions;
  port?: number;
};

export type StartedApiagexServer = ApiagexServer;
