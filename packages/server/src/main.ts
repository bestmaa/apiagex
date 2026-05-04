import { buildServer } from './app.js';
import { readServerConfig } from './config.js';

try {
  const config = readServerConfig();
  const app = await buildServer(config);
  await app.listen({ host: config.host, port: config.port });
} catch (error) {
  console.error(formatStartupError(error));
  process.exit(1);
}

function formatStartupError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  return [
    'Apiagex server failed to start.',
    message,
    'Check ADMIN_EMAIL, ADMIN_PASSWORD, AUTH_SECRET, HOST, and PORT.',
  ].join('\n');
}
