import type { LocalServerConfig, ServerConfigEnv } from "./server-config.type.js";
import type { ApiagexServer } from "./app.type.js";
import type { RegisterApiagexCustomRoutes } from "./custom-routes.type.js";

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
  customRoutes?: RegisterApiagexCustomRoutes;
  cwd?: string;
  env?: ServerConfigEnv;
  host?: string;
  initialOwner?: InitialOwnerOptions;
  port?: number;
};

export type StartedApiagexServer = ApiagexServer;
