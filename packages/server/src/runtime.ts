import { createServer } from "./app.js";
import { ensureLocalServerPaths, resolveLocalServerConfig } from "./server-config.js";
import type { RuntimeCliOptions, RuntimeCliResult, StartedApiagexServer, StartServerOptions } from "./runtime.type.js";

const runtimeVersion = "0.6.2";

export async function startApiagexServer(options: StartServerOptions = {}): Promise<StartedApiagexServer | undefined> {
  const env = options.env ?? process.env;
  const host = env.HOST ?? "127.0.0.1";
  const port = Number(env.PORT ?? 4000);
  const config = options.config ?? resolveLocalServerConfig(env, options.cwd ?? process.cwd());
  await ensureLocalServerPaths(config);
  const server = createServer(config);
  try {
    await server.listen({ host, port });
    console.log(`Apiagex listening on http://${host}:${port}`);
    console.log(`Apiagex database path: ${config.databasePath}`);
    console.log(`Apiagex uploads path: ${config.uploadsPath}`);
    return server;
  } catch (error) {
    server.log.error(error);
    process.exitCode = 1;
    return undefined;
  }
}

export async function runRuntimeCli(args: string[], options: RuntimeCliOptions = {}): Promise<RuntimeCliResult> {
  const command = args[0] ?? "--help";
  if (command === "--help" || command === "-h") return ok(renderRuntimeHelp());
  if (command === "--version" || command === "-v") return ok(`apiagex ${runtimeVersion}\n`);
  if (command === "smoke") return smoke(options);
  if (command === "build") return ok("Apiagex runtime does not need a project build. Run apiagex smoke to verify.\n");
  if (command === "dev" || command === "start") {
    const startOptions = {
      ...(options.cwd === undefined ? {} : { cwd: options.cwd }),
      ...(options.env === undefined ? {} : { env: options.env }),
    };
    await startApiagexServer(startOptions);
    return ok("");
  }
  return fail(`Unknown apiagex command: ${command}\n\n${renderRuntimeHelp()}`);
}

export function renderRuntimeHelp(): string {
  return `apiagex ${runtimeVersion}

Usage:
  apiagex dev       Start the Apiagex server for local development.
  apiagex start     Start the Apiagex server.
  apiagex smoke     Verify the runtime health route without a long-running server.
  apiagex build     Print build guidance for generated projects.

Options:
  -h, --help        Show help.
  -v, --version     Show version.

Environment:
  PORT                    Server port. Default: 4000.
  HOST                    Server host. Default: 127.0.0.1.
  APIAGEX_DATABASE_PATH   SQLite path. Default: .apiagex/apiagex.sqlite.
  APIAGEX_UPLOADS_PATH    Uploads path. Default: .apiagex/uploads.
`;
}

async function smoke(options: RuntimeCliOptions): Promise<RuntimeCliResult> {
  const server = createServer();
  const response = await server.inject({ method: "GET", url: "/api/health" });
  await server.close();
  if (response.statusCode !== 200 || response.json().ok !== true) {
    return fail("Apiagex smoke failed: /api/health did not return ok.\n");
  }
  const cwd = options.cwd ?? process.cwd();
  return ok(`Apiagex smoke passed in ${cwd}.\n`);
}

function ok(stdout: string): RuntimeCliResult {
  return { code: 0, stderr: "", stdout };
}

function fail(stderr: string): RuntimeCliResult {
  return { code: 1, stderr, stdout: "" };
}
