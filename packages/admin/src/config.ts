import type { AdminServerConfig } from './config.type.js';

export function readAdminConfig(source: NodeJS.ProcessEnv = process.env): AdminServerConfig {
  return {
    backendUrl: source.APIAGEX_BACKEND_URL ?? 'http://127.0.0.1:4000',
    host: source.ADMIN_HOST ?? '0.0.0.0',
    port: Number.parseInt(source.ADMIN_PORT ?? '3001', 10),
  };
}
