#!/usr/bin/env node
import { existsSync } from "node:fs";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageVersion = "0.6.1";

type CliOptions = {
  dryRun: boolean;
  help: boolean;
  target?: string;
  version: boolean;
};

export type CliResult = {
  code: number;
  stderr: string;
  stdout: string;
};

type ScaffoldFile = {
  content: string;
  path: string;
};

export async function runCli(args: string[], cwd = process.cwd()): Promise<CliResult> {
  const parsed = parseArgs(args);
  if (typeof parsed === "string") return fail(parsed);
  if (parsed.help) return ok(renderHelp());
  if (parsed.version) return ok(`create-apiagex ${packageVersion}\n`);
  if (!parsed.target) return fail("Target folder is required. Run create-apiagex --help for usage.");

  const validationError = validateProjectSlug(parsed.target);
  if (validationError) return fail(validationError);

  const targetDir = resolve(cwd, parsed.target);
  const folderState = await inspectTargetFolder(targetDir);
  if (folderState === "non-empty") {
    return fail(`Refusing to overwrite non-empty folder: ${targetDir}`);
  }

  const projectName = basename(targetDir);
  const files = createScaffoldFiles(projectName);
  const plan = renderPlan(projectName, targetDir, files, parsed.dryRun);
  if (parsed.dryRun) return ok(plan);

  await mkdir(targetDir, { recursive: true });
  for (const file of files) {
    const filePath = join(targetDir, file.path);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, file.content, "utf8");
  }

  return ok(`${plan}\nCreated ${files.length} files.\n`);
}

function parseArgs(args: string[]): CliOptions | string {
  const options: CliOptions = { dryRun: false, help: false, version: false };
  for (const arg of args) {
    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }
    if (arg === "--version" || arg === "-v") {
      options.version = true;
      continue;
    }
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    if (arg.startsWith("-")) {
      return `Unknown option: ${arg}`;
    }
    if (options.target) {
      return "Only one target folder is supported.";
    }
    options.target = arg;
  }
  return options;
}

function validateProjectSlug(target: string): string | undefined {
  if (!/^[a-z][a-z0-9-]*$/.test(target)) {
    return "Target folder must be a safe slug like my-cms.";
  }
  if (target.includes("--")) {
    return "Target folder cannot contain repeated hyphens.";
  }
  if (target.endsWith("-")) {
    return "Target folder cannot end with a hyphen.";
  }
  return undefined;
}

async function inspectTargetFolder(targetDir: string): Promise<"empty" | "missing" | "non-empty"> {
  if (!existsSync(targetDir)) return "missing";
  const entries = await readdir(targetDir);
  return entries.length === 0 ? "empty" : "non-empty";
}

function createScaffoldFiles(projectName: string): ScaffoldFile[] {
  return [
    {
      path: "package.json",
      content: `${JSON.stringify(
        {
          name: projectName,
          version: "0.1.0",
          private: true,
          type: "module",
          scripts: {
            dev: "apiagex dev",
            build: "apiagex build",
            smoke: "apiagex smoke",
          },
          dependencies: {
            apiagex: "^0.6.1",
          },
        },
        null,
        2,
      )}\n`,
    },
    {
      path: "README.md",
      content: `# ${projectName}\n\nGenerated Apiagex starter.\n\n## Next commands\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\nDocs run at /doc and the Admin UI runs at /adminui.\n`,
    },
    {
      path: ".gitignore",
      content: "node_modules\n.env\ndist\n.apiagex\n",
    },
    {
      path: ".env.example",
      content: "ADMIN_EMAIL=owner@example.com\nADMIN_PASSWORD=change-me\nAUTH_SECRET=change-me\nAPIAGEX_DATABASE_URL=file:./apiagex.sqlite\n",
    },
    {
      path: "apiagex.config.json",
      content: `${JSON.stringify({ database: { provider: "sqlite", url: "file:./apiagex.sqlite" } }, null, 2)}\n`,
    },
    {
      path: "src/main.ts",
      content: "console.log('Apiagex starter ready. Run npm run dev after installing Apiagex runtime.');\n",
    },
    {
      path: "docs/README.md",
      content: "# Apiagex Project Docs\n\nUse /doc for generated API docs and /readme for the project summary.\n",
    },
  ];
}

function renderPlan(
  projectName: string,
  targetDir: string,
  files: ScaffoldFile[],
  dryRun: boolean,
): string {
  const mode = dryRun ? "Dry run only. No files were written." : "Scaffolding project files.";
  const fileList = files.map((file) => `- ${file.path}`).join("\n");
  return [
    `create-apiagex will create ${projectName} at ${targetDir}.`,
    mode,
    "",
    "Files:",
    fileList,
    "",
    "Next commands:",
    `cd ${projectName}`,
    "npm install",
    "npm run dev",
    "",
  ].join("\n");
}

function renderHelp(): string {
  return `create-apiagex ${packageVersion}

Usage:
  create-apiagex <target-folder> [--dry-run]

Options:
  --dry-run       Print the scaffold plan without writing files.
  -h, --help      Show help.
  -v, --version   Show version.

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

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await runCli(process.argv.slice(2));
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  process.exitCode = result.code;
}
