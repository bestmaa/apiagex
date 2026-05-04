import type { DatabaseChoice } from './installer-plan.type.js';
import type { InstallerAnswers } from './installer.type.js';

const PROJECT_NAME_PATTERN = /^[a-z][a-z0-9-]*$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HOST_PATTERN = /^[a-z0-9.-]+$/i;

export function validateProjectName(projectName: string): string {
  const normalized = projectName.trim();

  if (!normalized) {
    throw new Error('Project name is required.');
  }

  if (!PROJECT_NAME_PATTERN.test(normalized)) {
    throw new Error('Project name must use lowercase letters, numbers, and hyphens only.');
  }

  return normalized;
}

export function validateInstallerAnswers(answers: InstallerAnswers): InstallerAnswers {
  const database = validateDatabaseChoice(answers.database);
  const common = {
    adminEmail: validateEmail(answers.adminEmail),
    adminPassword: validateRequiredValue(answers.adminPassword, 'Admin password is required.'),
    database,
    enableRealtime: answers.enableRealtime,
    projectName: validateProjectName(answers.projectName),
    targetFolder: validateProjectName(answers.targetFolder),
  };

  if (database === 'sqlite') {
    return {
      ...common,
      dbFile: validateRequiredValue(answers.dbFile ?? '', 'SQLite database file is required.'),
    };
  }

  return {
    ...common,
    dbHost: validateHost(answers.dbHost ?? ''),
    dbName: validateRequiredValue(answers.dbName ?? '', 'Database name is required.'),
    dbPassword: validateRequiredValue(answers.dbPassword ?? '', 'Database password is required.'),
    dbPort: validatePort(answers.dbPort ?? '', database),
    dbUser: validateRequiredValue(answers.dbUser ?? '', 'Database user is required.'),
  };
}

function validateDatabaseChoice(database: string): DatabaseChoice {
  if (database === 'sqlite' || database === 'postgres' || database === 'mysql') {
    return database;
  }

  throw new Error('Database choice is invalid.');
}

function validateEmail(email: string): string {
  const normalized = validateRequiredValue(email, 'Admin email is required.');

  if (!EMAIL_PATTERN.test(normalized)) {
    throw new Error('Admin email must be a valid email address.');
  }

  return normalized;
}

function validateHost(host: string): string {
  const normalized = validateRequiredValue(host, 'Database host is required.');

  if (!HOST_PATTERN.test(normalized)) {
    throw new Error('Database host contains invalid characters.');
  }

  return normalized;
}

function validatePort(port: string, database: DatabaseChoice): string {
  const normalized = validateRequiredValue(port, 'Database port is required.');
  const value = Number.parseInt(normalized, 10);
  const defaultPort = database === 'postgres' ? 5432 : 3306;

  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    throw new Error(`Database port must be a valid TCP port. Default is ${defaultPort}.`);
  }

  return String(value);
}

function validateRequiredValue(value: string, message: string): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(message);
  }

  return normalized;
}
