export type DatabaseChoice = 'sqlite' | 'postgres' | 'mysql';

export interface InstallerQuestion {
  defaultValue?: string;
  key: string;
  label: string;
  required: boolean;
}

export interface InstallerPlan {
  adminQuestions: InstallerQuestion[];
  databaseQuestions: Record<DatabaseChoice, InstallerQuestion[]>;
  projectQuestions: InstallerQuestion[];
  realtimeQuestions: InstallerQuestion[];
}
