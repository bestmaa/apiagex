import type { InstallerAnswers, GeneratedStarterProject } from './installer.type.js';
import type { InstallerPlan } from './installer-plan.type.js';
import type { PromptIO } from './prompt.type.js';

export interface CliResult {
  answers: InstallerAnswers;
  project: GeneratedStarterProject;
  plan: InstallerPlan;
}

export interface RunCliOptions {
  io?: PromptIO;
  targetDirectory?: string;
}
