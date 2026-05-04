import type { DatabaseChoice } from './installer-plan.type.js';

export interface InstallerAnswers {
  adminEmail: string;
  adminPassword: string;
  database: DatabaseChoice;
  dbFile?: string;
  dbHost?: string;
  dbName?: string;
  dbPassword?: string;
  dbPort?: string;
  dbUser?: string;
  projectName: string;
  targetFolder: string;
  enableRealtime: boolean;
}

export interface GeneratedStarterFile {
  content: string;
  path: string;
}

export interface GeneratedStarterProject {
  files: GeneratedStarterFile[];
  summary: string;
}
