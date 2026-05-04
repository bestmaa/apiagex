import type { GeneratedStarterProject } from './installer.type.js';
import type { StarterSmokeResult } from './starter-smoke.type.js';

const REQUIRED_PATHS = [
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
];

export function smokeStarterProject(project: GeneratedStarterProject): StarterSmokeResult {
  const paths = new Set(project.files.map((file) => file.path));
  const checks = [
    {
      name: 'required files exist',
      passed: REQUIRED_PATHS.every((path) => paths.has(path)),
    },
    {
      name: 'package script exists',
      passed: project.files.some((file) => file.path === 'package.json' && file.content.includes('"dev": "tsx src/main.ts"')),
    },
    {
      name: 'base tsconfig exists',
      passed: project.files.some((file) => file.path === 'tsconfig.base.json' && file.content.includes('"module": "NodeNext"')),
    },
    {
      name: 'sqlite dependency exists',
      passed: project.files.some((file) => file.path === 'package.json' && file.content.includes('"better-sqlite3"')),
    },
    {
      name: 'migration scaffold exists',
      passed: project.files.some((file) => file.path === 'src/migrate.ts' && file.content.includes('runMigrations')),
    },
    {
      name: 'content type storage scaffold exists',
      passed: project.files.some((file) => file.path === 'src/content-types.ts' && file.content.includes('createContentTypeInsertSql')),
    },
    {
      name: 'docs page exists',
      passed: project.files.some((file) => file.path === 'docs/index.html' && file.content.includes('Apiagex Docs')),
    },
  ];

  return {
    checks,
    passed: checks.every((check) => check.passed),
  };
}
