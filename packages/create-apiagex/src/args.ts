import type { CliOptions, DatabaseProvider, PackageManager, ProjectLanguage, SetupMode } from "./create-apiagex.type.js";

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
    else if (arg === "--language") {
      const value = args[index + 1];
      if (!isProjectLanguage(value)) return "Use --language js or ts.";
      options.language = value;
      index += 1;
    }
    else if (arg === "--database") {
      const value = args[index + 1];
      if (!isDatabaseProvider(value)) return "Use --database sqlite, postgres, or mysql.";
      options.databaseProvider = value;
      index += 1;
    } else if (arg === "--database-path") {
      const value = args[index + 1];
      if (!value) return "Use --database-path with a SQLite database path.";
      options.databasePath = value;
      index += 1;
    } else if (arg === "--database-url") {
      const value = args[index + 1];
      if (!value) return "Use --database-url with a PostgreSQL or MySQL connection URL.";
      options.databaseUrl = value;
      index += 1;
    } else if (arg === "--host") {
      const value = args[index + 1];
      if (!value) return "Use --host with a host value.";
      options.host = value;
      index += 1;
    } else if (arg === "--port") {
      const value = args[index + 1];
      if (!value || !/^\d+$/.test(value)) return "Use --port with a numeric port.";
      options.port = value;
      index += 1;
    } else if (arg === "--app-secret") {
      const value = args[index + 1];
      if (!value) return "Use --app-secret with a non-empty secret.";
      options.appSecret = value;
      index += 1;
    } else if (arg === "--owner-email") {
      const value = args[index + 1];
      if (!value) return "Use --owner-email with an email address.";
      options.ownerEmail = value;
      index += 1;
    } else if (arg === "--owner-password") {
      const value = args[index + 1];
      if (!value) return "Use --owner-password with a password.";
      options.ownerPassword = value;
      index += 1;
      options.bootstrapOwner = true;
    } else if (arg === "--package-manager") {
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

function isDatabaseProvider(value: string | undefined): value is DatabaseProvider {
  return value === "sqlite" || value === "postgres" || value === "mysql";
}

function isSetupMode(value: string | undefined): value is SetupMode {
  return value === "quickstart" || value === "custom";
}

function isProjectLanguage(value: string | undefined): value is ProjectLanguage {
  return value === "js" || value === "ts";
}
