#!/usr/bin/env node
import { existsSync } from "node:fs";
import { realpathSync } from "node:fs";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs, validateProjectSlug } from "./args.js";
import { resolveAnswers } from "./prompts.js";
import { createScaffoldFiles, renderPlan } from "./scaffold.js";
import type { CliResult, RunCliOptions } from "./create-apiagex.type.js";

const packageVersion = "0.8.1";

export async function runCli(args: string[], cwd = process.cwd(), io: RunCliOptions = {}): Promise<CliResult> {
  const parsed = parseArgs(args);
  if (typeof parsed === "string") return fail(parsed);
  if (parsed.help) return ok(renderHelp());
  if (parsed.version) return ok(`create-apiagex ${packageVersion}\n`);

  const answers = await resolveAnswers(parsed, io);
  if (typeof answers === "string") return fail(answers);
  const validationError = validateProjectSlug(answers.target);
  if (validationError) return fail(validationError);

  const targetDir = resolve(cwd, answers.target);
  const folderState = await inspectTargetFolder(targetDir);
  if (folderState === "non-empty") return fail(`Refusing to overwrite non-empty folder: ${targetDir}`);

  const projectName = basename(targetDir);
  const files = createScaffoldFiles({ ...answers, target: projectName });
  const plan = renderPlan(projectName, targetDir, files, answers, parsed.dryRun);
  if (parsed.dryRun) return ok(plan);

  await mkdir(targetDir, { recursive: true });
  for (const file of files) {
    const filePath = join(targetDir, file.path);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, file.content, "utf8");
  }

  return ok(`${plan}\nCreated ${files.length} files.\n`);
}

async function inspectTargetFolder(targetDir: string): Promise<"empty" | "missing" | "non-empty"> {
  if (!existsSync(targetDir)) return "missing";
  const entries = await readdir(targetDir);
  return entries.length === 0 ? "empty" : "non-empty";
}

function renderHelp(): string {
  return `create-apiagex ${packageVersion}

Usage:
  create-apiagex [target-folder] [options]

Options:
  --setup quickstart|custom      Choose starter setup mode.
  --database sqlite|postgres|mysql
                                Choose database provider.
  --database-path <path>         Set the SQLite database path.
  --database-url <url>           Set the PostgreSQL/MySQL connection URL.
  --host <host>                  Set the server host.
  --port <port>                  Set the server port.
  --app-secret <secret>          Set APIAGEX_SECRET instead of generating one.
  --owner-email <email>          Set first owner email when owner bootstrap is enabled.
  --owner-password <password>    Set first owner password and enable owner bootstrap.
  --package-manager npm|pnpm|yarn
  --install, --no-install        Record whether dependencies should be installed after scaffold.
  --git, --no-git                Record whether git should be initialized after scaffold.
  --owner, --no-owner            Configure first owner bootstrap on first server start.
  --dry-run                      Print the scaffold plan without writing files.
  -y, --yes                      Use defaults for missing options.
  -h, --help                     Show help.
  -v, --version                  Show version.

Rules:
  Target folder must be a safe slug like my-cms.
  Existing non-empty folders are never overwritten.
`;
}

function ok(stdout: string): CliResult {
  return { code: 0, stdout, stderr: "" };
}

function fail(message: string): CliResult {
  return { code: 1, stdout: "", stderr: `${message}\n` };
}

if (isDirectRun()) {
  const result = await runCli(process.argv.slice(2), process.cwd(), { interactive: process.stdin.isTTY });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  process.exitCode = result.code;
}

function isDirectRun(): boolean {
  const entry = process.argv[1];
  return Boolean(entry && realpathSync(entry) === fileURLToPath(import.meta.url));
}
