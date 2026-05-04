import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { createStarterProject, writeStarterProject } from '../src/installer.js';
import { createInstallerSuccessMessage } from '../src/installer-success.js';
import {
  validateInstallerAnswers,
  validateProjectName,
} from '../src/installer-validation.js';
import { runCli } from '../src/index.js';
import type { InstallerAnswers } from '../src/installer.type.js';
import type { PromptIO, PromptOption } from '../src/prompt.type.js';
import { smokeStarterProject } from '../src/starter-smoke.js';

const sqliteAnswers: InstallerAnswers = {
  adminEmail: 'admin@example.com',
  adminPassword: 'secret123',
  database: 'sqlite',
  dbFile: './data/apiagex.db',
  enableRealtime: true,
  projectName: 'demo-cms',
  targetFolder: 'demo-cms',
};

describe('createStarterProject', () => {
  it('generates sqlite config files', () => {
    const project = createStarterProject(sqliteAnswers);
    const fileMap = new Map(project.files.map((file) => [file.path, file.content]));

    expect(project.files.map((file) => file.path)).toEqual([
      'package.json',
      'tsconfig.base.json',
      'tsconfig.json',
      '.gitignore',
      '.env.example',
      'apiagex.config.json',
      'README.md',
      'src/main.ts',
      'src/app.type.ts',
      'src/config.type.ts',
      'src/config.ts',
      'src/app.ts',
      'src/content-types.type.ts',
      'src/content-types.ts',
      'src/migrations.type.ts',
      'src/migrations.ts',
      'src/migrate.ts',
      'src/database.type.ts',
      'src/database.ts',
      'docs/index.html',
      'docs/styles.css',
      'docs/app.js',
    ]);
    expect(fileMap.get('.env.example')).toContain('DATABASE_CLIENT=sqlite');
    expect(fileMap.get('.env.example')).toContain('ADMIN_EMAIL=admin@example.com');
    expect(fileMap.get('.env.example')).toContain('ADMIN_PASSWORD=secret123');
    expect(fileMap.get('apiagex.config.json')).toContain('"client": "sqlite"');
    expect(fileMap.get('apiagex.config.json')).toContain('"password": "secret123"');
    expect(fileMap.get('package.json')).toContain('better-sqlite3');
    expect(fileMap.get('docs/index.html')).toContain('Apiagex Docs');
    expect(fileMap.get('src/migrate.ts')).toContain('runMigrations');
    expect(fileMap.get('src/content-types.ts')).toContain('createContentTypeInsertSql');
  });

  it('writes files to a target directory', async () => {
    const root = await mkdtemp(join(tmpdir(), 'apiagex-'));
    const project = createStarterProject(sqliteAnswers);

    await writeStarterProject(root, project);

    const readme = await readFile(join(root, 'README.md'), 'utf8');

    expect(readme).toContain('demo-cms');
    expect(readme).toContain('Apiagex installer');
  });

  it('runs the cli with mocked prompts', async () => {
    const root = await mkdtemp(join(tmpdir(), 'apiagex-cli-'));
    const io = createMockIO([
      'demo-site',
      'demo-site',
      '1',
      './data/demo.db',
      '1',
      'admin@example.com',
      'secret123',
    ]);

    const result = await runCli({ io, targetDirectory: root });

    expect(result.answers.projectName).toBe('demo-site');
    expect(result.project.files.map((file) => file.path)).toContain('apiagex.config.json');
    expect(await readFile(join(root, 'apiagex.config.json'), 'utf8')).toContain('demo-site');
    expect(await readFile(join(root, 'src/app.ts'), 'utf8')).toContain('/docs');
  });

  it('stops when overwrite is rejected for an existing folder', async () => {
    const root = await mkdtemp(join(tmpdir(), 'apiagex-existing-'));
    await mkdir(join(root, 'nested'));
    await writeFile(join(root, 'nested', 'keep.txt'), 'keep', 'utf8');
    const io = createMockIO([
      'demo-site',
      'demo-site',
      '1',
      './data/demo.db',
      '1',
      'admin@example.com',
      'secret123',
      'no',
    ]);

    await expect(runCli({ io, targetDirectory: root })).rejects.toThrow(
      /Installation cancelled/,
    );
  });

  it('rejects invalid project names', () => {
    expect(() => validateProjectName('')).toThrow(/required/);
    expect(() => validateProjectName('Demo App')).toThrow(/lowercase/);
    expect(() => validateProjectName('1-demo')).toThrow(/lowercase/);
    expect(validateProjectName('demo-app')).toBe('demo-app');
  });

  it('rejects invalid installer config values', () => {
    expect(() =>
      validateInstallerAnswers({
        ...sqliteAnswers,
        adminEmail: 'invalid-email',
      }),
    ).toThrow(/email/i);

    expect(() =>
      validateInstallerAnswers({
        ...sqliteAnswers,
        adminPassword: '',
      }),
    ).toThrow(/password/i);

    expect(() =>
      validateInstallerAnswers({
        ...sqliteAnswers,
        dbFile: '   ',
      }),
    ).toThrow(/SQLite database file/i);
  });

  it('renders a post-install success screen', () => {
    expect(
      createInstallerSuccessMessage({
        docsUrl: 'http://localhost:4000/docs',
        projectName: 'demo-site',
        targetDirectory: '/tmp/demo-site',
      }),
    ).toEqual([
      'Project created: demo-site',
      'Target folder: /tmp/demo-site',
      '',
      'Next steps:',
      'cd demo-site',
      'npm install',
      'npm run dev',
      'Open http://localhost:4000/docs',
    ]);
  });

  it('passes the starter smoke check', () => {
    const project = createStarterProject(sqliteAnswers);
    const smoke = smokeStarterProject(project);

    expect(smoke.passed).toBe(true);
    expect(smoke.checks.every((check) => check.passed)).toBe(true);
  });
});

function createMockIO(responses: string[]): PromptIO {
  return {
    async ask(_message: string, defaultValue?: string): Promise<string> {
      return responses.shift() ?? defaultValue ?? '';
    },
    async choose(_message: string, options: PromptOption[]): Promise<string> {
      const response = responses.shift();

      if (!response) {
        return options[0]?.value ?? '';
      }

      const index = Number.parseInt(response, 10);

      if (Number.isInteger(index) && index >= 1 && index <= options.length) {
        return options[index - 1]?.value ?? options[0]?.value ?? '';
      }

      return response;
    },
    async confirm(_message: string, defaultValue?: boolean): Promise<boolean> {
      const response = responses.shift();

      if (response === undefined) {
        return defaultValue ?? false;
      }

      return ['1', 'true', 'yes', 'y'].includes(response.toLowerCase());
    },
    async close(): Promise<void> {
      return;
    },
  };
}
