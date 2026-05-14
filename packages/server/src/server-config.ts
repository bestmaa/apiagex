import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { DatabaseProvider, LocalServerConfig, ServerConfigEnv } from "./server-config.type.js";

const defaultDataDir = ".apiagex";
const supportedDatabaseProviders: DatabaseProvider[] = ["sqlite"];

export function resolveLocalServerConfig(
  env: ServerConfigEnv = process.env,
  cwd = process.cwd(),
): LocalServerConfig {
  const baseCwd = env.INIT_CWD ?? cwd;
  const databaseProvider = resolveDatabaseProvider(env.APIAGEX_DATABASE_PROVIDER);
  const databasePath = resolve(baseCwd, env.APIAGEX_DATABASE_PATH ?? `${defaultDataDir}/apiagex.sqlite`);
  const uploadsPath = resolve(baseCwd, env.APIAGEX_UPLOADS_PATH ?? `${defaultDataDir}/uploads`);
  return {
    ...(env.APIAGEX_SECRET === undefined ? {} : { appSecret: env.APIAGEX_SECRET }),
    databasePath,
    databaseProvider,
    uploadsPath,
  };
}

export async function ensureLocalServerPaths(config: LocalServerConfig): Promise<void> {
  await mkdir(dirname(config.databasePath), { recursive: true });
  await mkdir(config.uploadsPath, { recursive: true });
}

function resolveDatabaseProvider(value: string | undefined): DatabaseProvider {
  const provider = value ?? "sqlite";
  if (supportedDatabaseProviders.includes(provider as DatabaseProvider)) return provider as DatabaseProvider;
  throw new Error(`DATABASE_PROVIDER_NOT_SUPPORTED: ${provider}. Supported today: sqlite. Planned: postgres, mysql.`);
}
