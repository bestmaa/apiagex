import type { InstallerPlan } from './installer-plan.type.js';

export function createInstallerPlan(): InstallerPlan {
  return {
    adminQuestions: [
      { key: 'adminEmail', label: 'Admin email', required: true },
      { key: 'adminPassword', label: 'Admin password', required: true },
    ],
    databaseQuestions: {
      mysql: [
        { defaultValue: '127.0.0.1', key: 'dbHost', label: 'Database host', required: true },
        { defaultValue: '3306', key: 'dbPort', label: 'Database port', required: true },
        { key: 'dbName', label: 'Database name', required: true },
        { key: 'dbUser', label: 'Database user', required: true },
        { key: 'dbPassword', label: 'Database password', required: true },
      ],
      postgres: [
        { defaultValue: '127.0.0.1', key: 'dbHost', label: 'Database host', required: true },
        { defaultValue: '5432', key: 'dbPort', label: 'Database port', required: true },
        { key: 'dbName', label: 'Database name', required: true },
        { key: 'dbUser', label: 'Database user', required: true },
        { key: 'dbPassword', label: 'Database password', required: true },
      ],
      sqlite: [
        {
          defaultValue: './data/apiagex.db',
          key: 'dbFile',
          label: 'SQLite database file',
          required: true,
        },
      ],
    },
    projectQuestions: [
      { key: 'projectName', label: 'Project name', required: true },
      { defaultValue: 'sqlite', key: 'database', label: 'Database', required: true },
    ],
    realtimeQuestions: [
      {
        defaultValue: 'yes',
        key: 'enableRealtime',
        label: 'Enable realtime system',
        required: true,
      },
    ],
  };
}
