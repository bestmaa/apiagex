import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import type { InstallerAnswers, GeneratedStarterProject } from './installer.type.js';
import { createStarterProjectTemplate } from './starter-template.js';

export function createStarterProject(answers: InstallerAnswers): GeneratedStarterProject {
  const template = createStarterProjectTemplate(answers);

  return {
    files: template.files,
    summary: `Created starter project for ${template.projectName}.`,
  };
}

export async function writeStarterProject(
  targetDirectory: string,
  project: GeneratedStarterProject,
): Promise<void> {
  await mkdir(targetDirectory, { recursive: true });

  for (const file of project.files) {
    const filePath = join(targetDirectory, file.path);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, file.content, 'utf8');
  }
}
