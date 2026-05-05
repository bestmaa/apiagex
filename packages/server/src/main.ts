import { createServer } from "./app.js";
import { ensureLocalServerPaths, resolveLocalServerConfig } from "./server-config.js";

const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? "127.0.0.1";
const config = resolveLocalServerConfig();
await ensureLocalServerPaths(config);
const server = createServer(config);

try {
  await server.listen({ host, port });
  console.log(`Apiagex listening on http://${host}:${port}`);
  console.log(`Apiagex database path: ${config.databasePath}`);
  console.log(`Apiagex uploads path: ${config.uploadsPath}`);
} catch (error) {
  server.log.error(error);
  process.exit(1);
}
