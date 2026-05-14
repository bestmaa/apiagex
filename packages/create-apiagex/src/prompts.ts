import { createInterface } from "node:readline/promises";
import { randomBytes } from "node:crypto";
import type {
  CliOptions,
  DatabaseProvider,
  PromptFn,
  RunCliOptions,
  ScaffoldAnswers,
} from "./create-apiagex.type.js";

export async function resolveAnswers(options: CliOptions, io: RunCliOptions = {}): Promise<ScaffoldAnswers | string> {
  const prompt = io.prompt ?? nodePrompt(io);
  const canAsk = Boolean((io.interactive || io.prompt) && !options.yes);
  const target = options.target ?? (canAsk ? await ask(prompt, "Project name", "my-apiagex") : undefined);
  if (!target) return "Target folder is required. Run create-apiagex --help for usage.";
  const setupMode = options.setupMode ?? await choiceAnswer(prompt, canAsk, "Setup mode", "quickstart", ["quickstart", "custom"]);
  const databaseProvider = options.databaseProvider ?? await choiceAnswer(
    prompt,
    canAsk,
    "Database provider",
    "sqlite",
    ["sqlite", "postgres", "mysql"],
  );
  const databasePath = databaseProvider === "sqlite"
    ? options.databasePath ?? await setupAnswer(prompt, canAsk, setupMode, "SQLite database path", ".apiagex/apiagex.sqlite")
    : ".apiagex/apiagex.sqlite";
  const databaseUrl = await resolveDatabaseUrl(databaseProvider, options, prompt, canAsk);
  const host = options.host ?? await setupAnswer(prompt, canAsk, setupMode, "Server host", "127.0.0.1");
  const port = options.port ?? await setupAnswer(prompt, canAsk, setupMode, "Server port", "4000");
  const appSecret = options.appSecret ?? generateSecret();
  const packageManager = options.packageManager ?? await choiceAnswer(prompt, canAsk, "Package manager", "npm", ["npm", "pnpm", "yarn"]);
  const bootstrapOwner = await boolAnswer(prompt, canAsk, "Create first owner during first server start?", options.bootstrapOwner, false);
  const ownerEmail = bootstrapOwner
    ? options.ownerEmail ?? await setupAnswer(prompt, canAsk, setupMode, "Owner email", "owner@apiagex.local")
    : undefined;
  const ownerPassword = bootstrapOwner
    ? options.ownerPassword ?? await setupAnswer(prompt, canAsk, setupMode, "Owner password", generatePassword())
    : undefined;
  return {
    appSecret,
    bootstrapOwner,
    databasePath,
    databaseProvider,
    ...(databaseUrl === undefined ? {} : { databaseUrl }),
    host,
    initGit: await boolAnswer(prompt, canAsk, "Initialize git repository?", options.initGit, true),
    installDependencies: await boolAnswer(prompt, canAsk, "Install dependencies after scaffold?", options.installDependencies, false),
    ...(ownerEmail === undefined ? {} : { ownerEmail }),
    ...(ownerPassword === undefined ? {} : { ownerPassword }),
    packageManager,
    port,
    setupMode,
    target,
  };
}

async function resolveDatabaseUrl(
  provider: DatabaseProvider,
  options: CliOptions,
  prompt: PromptFn,
  canAsk: boolean,
): Promise<string | undefined> {
  if (provider === "sqlite") return undefined;
  if (options.databaseUrl) return options.databaseUrl;
  if (!canAsk) return providerDefaultUrl(provider);
  return ask(prompt, `${providerLabel(provider)} database URL`, providerDefaultUrl(provider));
}

function providerDefaultUrl(provider: Exclude<DatabaseProvider, "sqlite">): string {
  if (provider === "postgres") return "postgres://apiagex:change-me@localhost:5432/apiagex";
  return "mysql://apiagex:change-me@localhost:3306/apiagex";
}

function providerLabel(provider: DatabaseProvider): string {
  if (provider === "postgres") return "PostgreSQL";
  if (provider === "mysql") return "MySQL";
  return "SQLite";
}

async function boolAnswer(
  prompt: PromptFn,
  canAsk: boolean,
  message: string,
  value: boolean | undefined,
  defaultValue: boolean,
): Promise<boolean> {
  if (value !== undefined || !canAsk) return value ?? defaultValue;
  const answer = (await ask(prompt, message, defaultValue ? "yes" : "no")).toLowerCase();
  return answer === "y" || answer === "yes" || answer === "true";
}

async function choiceAnswer<const T extends string>(
  prompt: PromptFn,
  canAsk: boolean,
  message: string,
  defaultValue: T,
  allowed: readonly T[],
): Promise<T> {
  if (!canAsk) return defaultValue;
  const answer = await ask(prompt, `${message} (${allowed.join("/")})`, defaultValue);
  return allowed.includes(answer as T) ? answer as T : defaultValue;
}

async function setupAnswer(
  prompt: PromptFn,
  canAsk: boolean,
  setupMode: string,
  message: string,
  defaultValue: string,
): Promise<string> {
  if (!canAsk || setupMode !== "custom") return defaultValue;
  return ask(prompt, message, defaultValue);
}

async function ask(prompt: PromptFn, message: string, defaultValue: string): Promise<string> {
  const answer = (await prompt({ defaultValue, message })).trim();
  return answer || defaultValue;
}

function generateSecret(): string {
  return randomBytes(32).toString("base64url");
}

function generatePassword(): string {
  return `Apiagex-${randomBytes(9).toString("base64url")}1!`;
}

function nodePrompt(io: RunCliOptions): PromptFn {
  return async ({ defaultValue, message }) => {
    const input = io.stdin ?? process.stdin;
    const output = io.stdout ?? process.stdout;
    const rl = createInterface({ input, output });
    try {
      return await rl.question(`${message} (${defaultValue}): `);
    } finally {
      rl.close();
    }
  };
}
