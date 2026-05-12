import type { CliOptions, PackageManager, SetupMode } from "./create-apiagex.type.js";

export function parseArgs(args: string[]): CliOptions | string {
  const options: CliOptions = { dryRun: false, help: false, version: false, yes: false };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index] ?? "";
    if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg === "--version" || arg === "-v") options.version = true;
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--yes" || arg === "-y") options.yes = true;
    else if (arg === "--install") options.installDependencies = true;
    else if (arg === "--no-install") options.installDependencies = false;
    else if (arg === "--git") options.initGit = true;
    else if (arg === "--no-git") options.initGit = false;
    else if (arg === "--owner") options.bootstrapOwner = true;
    else if (arg === "--no-owner") options.bootstrapOwner = false;
    else if (arg === "--package-manager") {
      const value = args[index + 1];
      if (!isPackageManager(value)) return "Use --package-manager npm, pnpm, or yarn.";
      options.packageManager = value;
      index += 1;
    } else if (arg === "--setup") {
      const value = args[index + 1];
      if (!isSetupMode(value)) return "Use --setup quickstart or custom.";
      options.setupMode = value;
      index += 1;
    } else if (arg.startsWith("-")) return `Unknown option: ${arg}`;
    else if (options.target) return "Only one target folder is supported.";
    else options.target = arg;
  }
  return options;
}

export function validateProjectSlug(target: string): string | undefined {
  if (!/^[a-z][a-z0-9-]*$/.test(target)) return "Target folder must be a safe slug like my-cms.";
  if (target.includes("--")) return "Target folder cannot contain repeated hyphens.";
  if (target.endsWith("-")) return "Target folder cannot end with a hyphen.";
  return undefined;
}

function isPackageManager(value: string | undefined): value is PackageManager {
  return value === "npm" || value === "pnpm" || value === "yarn";
}

function isSetupMode(value: string | undefined): value is SetupMode {
  return value === "quickstart" || value === "custom";
}
