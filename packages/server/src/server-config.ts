import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { DatabaseProvider, LocalServerConfig, ServerConfigEnv } from "./server-config.type.js";

const defaultDataDir = ".apiagex";
const supportedDatabaseProviders: DatabaseProvider[] = ["sqlite", "postgres", "mysql"];

export function resolveLocalServerConfig(
  env: ServerConfigEnv = process.env,
  cwd = process.cwd(),
): LocalServerConfig {
  const baseCwd = env.INIT_CWD ?? cwd;
  const databaseProvider = resolveDatabaseProvider(env.APIAGEX_DATABASE_PROVIDER);
  const databaseUrl = resolveDatabaseUrl(databaseProvider, env.APIAGEX_DATABASE_URL);
  const databasePath = resolve(baseCwd, env.APIAGEX_DATABASE_PATH ?? `${defaultDataDir}/apiagex.sqlite`);
  const uploadsPath = resolve(baseCwd, env.APIAGEX_UPLOADS_PATH ?? `${defaultDataDir}/uploads`);
  return {
    ...(env.APIAGEX_SECRET === undefined ? {} : { appSecret: env.APIAGEX_SECRET }),
    ...(databaseUrl === undefined ? {} : { databaseUrl }),
    databasePath,
    databaseProvider,
    ...(env.APIAGEX_MULTI_TENANT === "true"
      ? {
          multiTenant: {
            enabled: true,
            ...(env.APIAGEX_TENANT_PATH_PREFIX === undefined ? {} : { pathPrefix: env.APIAGEX_TENANT_PATH_PREFIX }),
            platformDatabaseProvider: resolveDatabaseProvider(env.APIAGEX_PLATFORM_DATABASE_PROVIDER),
            platformDatabaseUrl: requiredEnv(env.APIAGEX_PLATFORM_DATABASE_URL, "APIAGEX_PLATFORM_DATABASE_URL"),
            ...(env.APIAGEX_TENANT_ROOT_DOMAIN === undefined ? {} : { rootDomain: env.APIAGEX_TENANT_ROOT_DOMAIN }),
            secretKeyBase64: requiredEnv(env.APIAGEX_TENANT_SECRET_KEY, "APIAGEX_TENANT_SECRET_KEY"),
          },
        }
      : {}),
    uploadsPath,
  };
}

export async function ensureLocalServerPaths(config: LocalServerConfig): Promise<void> {
  if (config.databaseProvider === "sqlite") await mkdir(dirname(config.databasePath), { recursive: true });
  await mkdir(config.uploadsPath, { recursive: true });
}

function resolveDatabaseProvider(value: string | undefined): DatabaseProvider {
  const provider = value ?? "sqlite";
  if (supportedDatabaseProviders.includes(provider as DatabaseProvider)) return provider as DatabaseProvider;
  throw new Error(`DATABASE_PROVIDER_NOT_SUPPORTED: ${provider}. Supported today: sqlite, postgres, mysql.`);
}

function resolveDatabaseUrl(provider: DatabaseProvider, value: string | undefined): string | undefined {
  if (provider === "sqlite") return undefined;
  if (!value?.trim()) throw new Error(`DATABASE_URL_REQUIRED: ${provider}`);
  return value.trim();
}

function requiredEnv(value: string | undefined, name: string): string {
  if (!value?.trim()) throw new Error(`${name}_REQUIRED`);
  return value.trim();
}
