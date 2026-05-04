import type { InstallerSuccessDetails } from './installer-success.type.js';

export function createInstallerSuccessMessage(
  details: InstallerSuccessDetails,
): string[] {
  return [
    `Project created: ${details.projectName}`,
    `Target folder: ${details.targetDirectory}`,
    '',
    'Next steps:',
    `cd ${details.projectName}`,
    'npm install',
    'npm run dev',
    `Open ${details.docsUrl}`,
  ];
}
