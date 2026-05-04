import type { InstallerAnswers } from './installer.type.js';
import type { StarterTemplate } from './starter-template.type.js';

export function createBaseFiles(answers: InstallerAnswers): StarterTemplate[] {
  return [
    createPackageJson(answers),
    createTsConfigBase(),
    createTsConfig(),
    createGitIgnore(),
    createEnvExample(answers),
    createConfigJson(answers),
    createReadme(answers),
  ];
}

function createPackageJson(answers: InstallerAnswers): StarterTemplate {
  return {
    content: JSON.stringify(
      {
        description: 'Apiagex generated starter project.',
        devDependencies: {
          '@fastify/static': '^9.1.3',
          '@types/better-sqlite3': '^7.6.13',
          '@types/node': '^25.6.0',
          'better-sqlite3': '^12.9.0',
          fastify: '^5.8.5',
          tsx: '^4.21.0',
          typescript: '^6.0.3',
          vitest: '^4.1.5',
        },
        name: answers.projectName,
        private: true,
        scripts: {
          build: 'tsc -b',
          dev: 'tsx src/main.ts',
          start: 'node dist/main.js',
          test: 'vitest run',
        },
        type: 'module',
        version: '0.1.0',
      },
      null,
      2,
    ) + '\n',
    path: 'package.json',
  };
}

function createTsConfig(): StarterTemplate {
  return {
    content: [
      '{',
      '  "extends": "./tsconfig.base.json",',
      '  "compilerOptions": {',
      '    "outDir": "dist",',
      '    "rootDir": "src"',
      '  },',
      '  "include": ["src/**/*.ts"]',
      '}',
      '',
    ].join('\n'),
    path: 'tsconfig.json',
  };
}

function createTsConfigBase(): StarterTemplate {
  return {
    content: [
      '{',
      '  "compilerOptions": {',
      '    "declaration": true,',
      '    "declarationMap": true,',
      '    "exactOptionalPropertyTypes": true,',
      '    "forceConsistentCasingInFileNames": true,',
      '    "module": "NodeNext",',
      '    "moduleResolution": "NodeNext",',
      '    "noUncheckedIndexedAccess": true,',
      '    "skipLibCheck": true,',
      '    "strict": true,',
      '    "target": "ES2022",',
      '    "types": ["node"]',
      '  }',
      '}',
      '',
    ].join('\n'),
    path: 'tsconfig.base.json',
  };
}

function createGitIgnore(): StarterTemplate {
  return {
    content: ['dist/', 'node_modules/', '*.log', ''].join('\n'),
    path: '.gitignore',
  };
}

function createEnvExample(answers: InstallerAnswers): StarterTemplate {
  const lines =
    answers.database === 'sqlite'
      ? [
          'NODE_ENV=development',
          'HOST=0.0.0.0',
          'PORT=4000',
          `ADMIN_EMAIL=${answers.adminEmail}`,
          `ADMIN_PASSWORD=${answers.adminPassword}`,
          'EDITOR_EMAIL=',
          'EDITOR_PASSWORD=',
          'VIEWER_EMAIL=',
          'VIEWER_PASSWORD=',
          'AUTH_SECRET=apiagex-dev-secret',
          'DATABASE_CLIENT=sqlite',
          `DATABASE_URL=${answers.dbFile ?? './data/apiagex.db'}`,
          `REALTIME_ENABLED=${answers.enableRealtime ? 'true' : 'false'}`,
        ]
      : [
          'NODE_ENV=development',
          'HOST=0.0.0.0',
          'PORT=4000',
          `ADMIN_EMAIL=${answers.adminEmail}`,
          `ADMIN_PASSWORD=${answers.adminPassword}`,
          'EDITOR_EMAIL=',
          'EDITOR_PASSWORD=',
          'VIEWER_EMAIL=',
          'VIEWER_PASSWORD=',
          'AUTH_SECRET=apiagex-dev-secret',
          `DATABASE_CLIENT=${answers.database}`,
          `DATABASE_URL=${createDatabaseUrl(answers)}`,
          `REALTIME_ENABLED=${answers.enableRealtime ? 'true' : 'false'}`,
        ];

  return {
    content: `${lines.join('\n')}\n`,
    path: '.env.example',
  };
}

function createConfigJson(answers: InstallerAnswers): StarterTemplate {
  return {
    content: `${JSON.stringify(
      {
        admin: {
          email: answers.adminEmail,
          password: answers.adminPassword,
        },
        auth: {
          secret: 'apiagex-dev-secret',
        },
        database:
          answers.database === 'sqlite'
            ? {
                client: 'sqlite',
                file: answers.dbFile ?? './data/apiagex.db',
              }
            : {
                client: answers.database,
                host: answers.dbHost,
                name: answers.dbName,
                password: answers.dbPassword,
                port: Number(answers.dbPort),
                user: answers.dbUser,
              },
        projectName: answers.projectName,
        realtime: {
          enabled: answers.enableRealtime,
        },
      },
      null,
      2,
    )}\n`,
    path: 'apiagex.config.json',
  };
}

function createReadme(answers: InstallerAnswers): StarterTemplate {
  return {
    content: [
      `# ${answers.projectName}`,
      '',
      '## English',
      '',
      'This project was generated with the Apiagex installer.',
      '',
      'Run the starter with:',
      '',
      '```bash',
      'npm install',
      'npm run dev',
      '```',
      '',
      'Open `http://localhost:4000/docs` after the server starts.',
      '',
      '## Hindi',
      '',
      'Ye project Apiagex installer se generate hua hai.',
      '',
      'Run karne ke liye:',
      '',
      '```bash',
      'npm install',
      'npm run dev',
      '```',
      '',
      'Server start hone ke baad `http://localhost:4000/docs` open karo.',
      '',
    ].join('\n'),
    path: 'README.md',
  };
}

function createDatabaseUrl(answers: InstallerAnswers): string {
  const host = answers.dbHost ?? '127.0.0.1';
  const port = answers.dbPort ?? (answers.database === 'postgres' ? '5432' : '3306');
  const user = answers.dbUser ?? 'user';
  const password = answers.dbPassword ?? 'password';
  const name = answers.dbName ?? 'apiagex';

  return `${answers.database}://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${name}`;
}
