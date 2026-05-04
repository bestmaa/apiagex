import { createServer } from "./app.js";

const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? "127.0.0.1";
const server = createServer();

try {
  await server.listen({ host, port });
  console.log(`Apiagex listening on http://${host}:${port}`);
} catch (error) {
  server.log.error(error);
  process.exit(1);
}
