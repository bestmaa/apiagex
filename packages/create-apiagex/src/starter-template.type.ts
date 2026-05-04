import type { InstallerAnswers } from './installer.type.js';

export interface StarterTemplate {
  content: string;
  path: string;
}

export interface StarterProjectTemplate {
  files: StarterTemplate[];
  projectName: string;
  answers: InstallerAnswers;
}
