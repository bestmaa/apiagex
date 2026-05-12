import { createInterface } from "node:readline/promises";
import type {
  CliOptions,
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
  const packageManager = options.packageManager ?? await choiceAnswer(prompt, canAsk, "Package manager", "npm", ["npm", "pnpm", "yarn"]);
  return {
    bootstrapOwner: await boolAnswer(prompt, canAsk, "Bootstrap owner during scaffold?", options.bootstrapOwner, false),
    initGit: await boolAnswer(prompt, canAsk, "Initialize git repository?", options.initGit, true),
    installDependencies: await boolAnswer(prompt, canAsk, "Install dependencies after scaffold?", options.installDependencies, false),
    packageManager,
    setupMode,
    target,
  };
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

async function ask(prompt: PromptFn, message: string, defaultValue: string): Promise<string> {
  const answer = (await prompt({ defaultValue, message })).trim();
  return answer || defaultValue;
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
