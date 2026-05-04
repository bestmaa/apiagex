import type { StarterTemplate } from './starter-template.type.js';

export function createServerFiles(): StarterTemplate[] {
  return [createMainTs(), createAppTypeTs(), createConfigTypeTs(), createConfigTs(), createAppTs()];
}

function createMainTs(): StarterTemplate {
  return {
    content: [
      "import { buildApp } from './app.js';",
      "import { readConfig } from './config.js';",
      '',
      'const config = readConfig();',
      'const app = await buildApp(config);',
      '',
      'try {',
      '  await app.listen({ host: config.host, port: config.port });',
      '} catch (error) {',
      '  app.log.error(error);',
      '  process.exit(1);',
      '}',
      '',
    ].join('\n'),
    path: 'src/main.ts',
  };
}

function createAppTypeTs(): StarterTemplate {
  return {
    content: [
      "import type { FastifyInstance } from 'fastify';",
      '',
      'export type ApiagexApp = FastifyInstance;',
      '',
    ].join('\n'),
    path: 'src/app.type.ts',
  };
}

function createConfigTypeTs(): StarterTemplate {
  return {
    content: [
      'export interface StarterServerConfig {',
      '  host: string;',
      "  databaseClient: 'sqlite' | 'postgres' | 'mysql';",
      '  databaseUrl: string;',
      '  port: number;',
      '}',
      '',
    ].join('\n'),
    path: 'src/config.type.ts',
  };
}

function createConfigTs(): StarterTemplate {
  return {
    content: [
      "import type { StarterServerConfig } from './config.type.js';",
      '',
      'export function readConfig(source: NodeJS.ProcessEnv = process.env): StarterServerConfig {',
      '  return {',
      "    host: source.HOST ?? '0.0.0.0',",
      "    databaseClient: (source.DATABASE_CLIENT as StarterServerConfig['databaseClient']) ?? 'sqlite',",
      "    databaseUrl: source.DATABASE_URL ?? './data/apiagex.db',",
      "    port: Number.parseInt(source.PORT ?? '4000', 10),",
      '  };',
      '}',
      '',
    ].join('\n'),
    path: 'src/config.ts',
  };
}

function createAppTs(): StarterTemplate {
  return {
    content: [
      "import fastifyStatic from '@fastify/static';",
      "import fastify from 'fastify';",
      "import { resolve } from 'node:path';",
      '',
      "import type { ApiagexApp } from './app.type.js';",
      "import { openDatabase } from './database.js';",
      "import type { StarterServerConfig } from './config.type.js';",
      "import { runMigrations } from './migrate.js';",
      '',
      'export async function buildApp(config: StarterServerConfig): Promise<ApiagexApp> {',
      '  const app = fastify({ logger: true });',
      '  const database = await openDatabase(config);',
      "  const docsRoot = resolve(process.cwd(), 'docs');",
      '',
      '  if (database) {',
      '    await runMigrations(database);',
      '',
      "    app.addHook('onClose', async () => {",
      '      database.close();',
      '    });',
      '  }',
      '',
      '  await app.register(fastifyStatic, {',
      '    decorateReply: false,',
      "    index: 'index.html',",
      "    prefix: '/docs/',",
      '    root: docsRoot,',
      '  });',
      '',
      "  app.get('/health', async () => ({",
      "    docs: '/docs',",
      "    service: 'apiagex',",
      '    database: database ? database.client : null,',
      "    status: 'ok',",
      '  }));',
      '',
      "  app.get('/', async (_request, reply) => reply.redirect('/docs/'));",
      "  app.get('/docs', async (_request, reply) => reply.redirect('/docs/'));",
      '',
      '  return app;',
      '}',
      '',
    ].join('\n'),
    path: 'src/app.ts',
  };
}
