import type { InstallerAnswers } from './installer.type.js';
import type { StarterProjectTemplate } from './starter-template.type.js';
import { createBaseFiles } from './starter-base.js';
import { createContentFiles } from './starter-content.js';
import { createDocsFiles } from './starter-docs.js';
import { createMigrationFiles } from './starter-migrations.js';
import { createServerFiles } from './starter-server.js';
import { createSQLiteFiles } from './starter-sqlite.js';

export function createStarterProjectTemplate(
  answers: InstallerAnswers,
): StarterProjectTemplate {
  return {
    answers,
    files: [
      ...createBaseFiles(answers),
      ...createServerFiles(),
      ...createContentFiles(),
      ...createMigrationFiles(),
      ...createSQLiteFiles(),
      ...createDocsFiles(answers),
    ],
    projectName: answers.projectName,
  };
}
