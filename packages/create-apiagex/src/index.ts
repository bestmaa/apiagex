#!/usr/bin/env node
import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createInstallerPlan } from './installer-plan.js';
import { createInstallerSuccessMessage } from './installer-success.js';
import type { CliResult, RunCliOptions } from './index.type.js';
import { createStarterProject, writeStarterProject } from './installer.js';
import { validateInstallerAnswers, validateProjectName } from './installer-validation.js';
import { createPromptIO } from './prompt.js';
import { smokeStarterProject } from './starter-smoke.js';
import type { DatabaseChoice } from './installer-plan.type.js';
import type { InstallerAnswers } from './installer.type.js';
import type { PromptIO } from './prompt.type.js';

export async function runCli(options: RunCliOptions = {}): Promise<CliResult> {
  const plan = createInstallerPlan();
  const io = options.io ?? createPromptIO();
  try {
    const answers = validateInstallerAnswers(await collectAnswers(io));
    const project = createStarterProject(answers);
    const targetDirectory = resolve(process.cwd(), options.targetDirectory ?? answers.targetFolder);

    await ensureTargetDirectory(io, targetDirectory);

    await writeStarterProject(targetDirectory, project);

    const smoke = smokeStarterProject(project);
    if (!smoke.passed) {
      throw new Error(
        `Starter smoke check failed: ${smoke.checks
          .filter((check) => !check.passed)
          .map((check) => check.name)
          .join(', ')}`,
      );
    }

    for (const line of createInstallerSuccessMessage({
      docsUrl: 'http://localhost:4000/docs',
      projectName: answers.projectName,
      targetDirectory,
    })) {
      console.log(line);
    }

    console.log('Starter smoke check passed.');

    return { answers, plan, project };
  } finally {
    await io.close();
  }
}

async function collectAnswers(io: PromptIO): Promise<InstallerAnswers> {
  const projectName = validateProjectName(await io.ask('Project name', 'my-cms'));
  const targetFolder = validateProjectName(await io.ask('Target folder', projectName));
  const database = (await io.choose('Database', [
    { label: 'SQLite local file', value: 'sqlite' },
    { label: 'PostgreSQL', value: 'postgres' },
    { label: 'MySQL', value: 'mysql' },
  ])) as DatabaseChoice;
  const base =
    database === 'sqlite'
      ? {
          dbFile: await io.ask('SQLite database file', './data/apiagex.db'),
        }
      : {
          dbHost: await io.ask('Database host', '127.0.0.1'),
          dbName: await io.ask('Database name'),
          dbPassword: await io.ask('Database password'),
          dbPort: await io.ask('Database port', database === 'postgres' ? '5432' : '3306'),
          dbUser: await io.ask('Database user'),
        };
  const enableRealtime = (await io.choose('Enable realtime', [
    { label: 'Yes', value: 'true' },
    { label: 'No', value: 'false' },
  ])) === 'true';

  return {
    adminEmail: await io.ask('Admin email'),
    adminPassword: await io.ask('Admin password'),
    ...base,
    database,
    enableRealtime,
    projectName,
    targetFolder,
  };
}

async function ensureTargetDirectory(io: PromptIO, targetDirectory: string): Promise<void> {
  try {
    const entries = await readdir(targetDirectory);

    if (entries.length === 0) {
      return;
    }

    const overwrite = await io.confirm(
      `Folder already exists: ${targetDirectory}. Overwrite its contents?`,
      false,
    );

    if (!overwrite) {
      throw new Error(`Installation cancelled for existing folder: ${targetDirectory}`);
    }
  } catch (error) {
    if (isMissingDirectory(error)) {
      return;
    }

    throw error;
  }
}

function isMissingDirectory(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'ENOENT';
}

const entryPath = process.argv[1] ? resolve(process.argv[1]) : '';
const modulePath = fileURLToPath(import.meta.url);

if (entryPath && resolve(entryPath) === resolve(modulePath)) {
  await runCli().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
