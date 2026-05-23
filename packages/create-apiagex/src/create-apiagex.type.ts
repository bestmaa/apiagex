import type { Readable, Writable } from "node:stream";

export type PackageManager = "npm" | "pnpm" | "yarn";
export type SetupMode = "custom" | "quickstart";
export type DatabaseProvider = "sqlite" | "postgres" | "mysql";
export type ProjectLanguage = "js" | "ts";

export type CliOptions = {
  appSecret?: string;
  bootstrapOwner?: boolean;
  databasePath?: string;
  databaseProvider?: DatabaseProvider;
  databaseUrl?: string;
  dryRun: boolean;
  help: boolean;
  host?: string;
  initGit?: boolean;
  installDependencies?: boolean;
  language?: ProjectLanguage;
  multiTenant?: boolean;
  ownerEmail?: string;
  ownerPassword?: string;
  packageManager?: PackageManager;
  port?: string;
  setupMode?: SetupMode;
  target?: string;
  version: boolean;
  yes: boolean;
};

export type CliResult = {
  code: number;
  stderr: string;
  stdout: string;
};

export type PromptQuestion = {
  defaultValue: string;
  message: string;
};

export type PromptFn = (question: PromptQuestion) => Promise<string>;

export type RunCliOptions = {
  interactive?: boolean;
  prompt?: PromptFn;
  stdin?: Readable;
  stdout?: Writable;
};

export type ScaffoldAnswers = {
  appSecret: string;
  bootstrapOwner: boolean;
  databasePath: string;
  databaseProvider: DatabaseProvider;
  databaseUrl?: string;
  host: string;
  initGit: boolean;
  installDependencies: boolean;
  language: ProjectLanguage;
  multiTenant: boolean;
  ownerEmail?: string;
  ownerPassword?: string;
  packageManager: PackageManager;
  port: string;
  setupMode: SetupMode;
  target: string;
};

export type ScaffoldFile = {
  content: string;
  path: string;
};
