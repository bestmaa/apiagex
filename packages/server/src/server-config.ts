import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { LocalServerConfig, ServerConfigEnv } from "./server-config.type.js";

const defaultDataDir = ".apiagex";

export function resolveLocalServerConfig(
  env: ServerConfigEnv = process.env,
  cwd = process.cwd(),
): LocalServerConfig {
  const databasePath = resolve(cwd, env.APIAGEX_DATABASE_PATH ?? `${defaultDataDir}/apiagex.sqlite`);
  const uploadsPath = resolve(cwd, env.APIAGEX_UPLOADS_PATH ?? `${defaultDataDir}/uploads`);
  return { databasePath, uploadsPath };
}

export async function ensureLocalServerPaths(config: LocalServerConfig): Promise<void> {
  await mkdir(dirname(config.databasePath), { recursive: true });
  await mkdir(config.uploadsPath, { recursive: true });
}
