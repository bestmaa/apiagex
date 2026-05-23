import type { ApiagexDatabase, DatabaseProvider } from "./database-adapter.type.js";
import { openMySqlAdapter } from "./mysql-adapter.js";
import { openPostgresAdapter } from "./postgres-adapter.js";
import { openSqliteAdapter } from "./sqlite-adapter.js";

export type PlatformDatabaseConfig = {
  provider: DatabaseProvider;
  url: string;
};

export async function openPlatformDatabase(config: PlatformDatabaseConfig): Promise<ApiagexDatabase> {
  const url = config.url.trim();
  if (!url) throw new Error(`PLATFORM_DATABASE_URL_REQUIRED: ${config.provider}`);
  if (config.provider === "sqlite") return openSqliteAdapter(sqlitePathFromUrl(url));
  if (config.provider === "postgres") return openPostgresAdapter(url, { migrate: false });
  if (config.provider === "mysql") return openMySqlAdapter(url, { migrate: false });
  throw new Error(`PLATFORM_DATABASE_PROVIDER_UNSUPPORTED:${String(config.provider)}`);
}

export function sqlitePathFromUrl(value: string): string {
  if (value === ":memory:") return value;
  if (value.startsWith("file://")) return new URL(value).pathname;
  if (value.startsWith("file:")) return value.slice("file:".length);
  return value;
}
