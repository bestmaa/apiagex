import fastifyStatic from '@fastify/static';
import fastify from 'fastify';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createAdminAuthService } from './auth.js';
import { createSqliteAuditLogsRepository } from './audit-logs.repository.js';
import { createPublicResponseCache } from './content-public.cache.js';
import { createSqliteContentEntriesRepository } from './content-entries.repository.js';
import { createContentPublishScheduler } from './content-publish.scheduler.js';
import { createSqliteContentTypesRepository } from './content-types.repository.js';
import { createSqliteMediaFilesRepository } from './media.repository.js';
import { createMediaStorageAdapter } from './media-storage.factory.js';
import { createSqliteRolesRepository } from './roles.repository.js';
import { createSqliteSchemaMigrationsRepository } from './schema-migrations.repository.js';
import { ensureSqlitePerformanceIndexes } from './sqlite-performance-indexes.js';
import { createRealtimeStreamManager } from './realtime.service.js';
import { createWebhookEventBus } from './webhooks.events.js';
import { createWebhookDispatcher } from './webhooks.dispatcher.js';
import { createSqliteWebhooksRepository } from './webhooks.repository.js';
import {
  DEFAULT_ADMIN_EMAIL,
  DEFAULT_ADMIN_PASSWORD,
  DEFAULT_AUTH_SECRET,
} from './config.js';
import { buildHealthResponse } from './health.js';
import { registerServerRoutes } from './server.routes.js';
import type { ApiagexServer, BuildServerOptions } from './app.type.js';

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const workspaceRoot = resolve(packageRoot, '../..');

export async function buildServer(
  options: BuildServerOptions = {},
): Promise<ApiagexServer> {
  const app = fastify({ logger: options.logger ?? true, requestIdHeader: 'x-request-id' });
  const docsRoot = options.docsRoot ?? resolve(workspaceRoot, 'docs');
  const contentTypesDatabaseFile =
    options.contentTypesDatabaseFile ?? resolve(workspaceRoot, 'data', 'content-types.db');
  const mediaStorageDir = options.mediaStorageDir ?? resolve(workspaceRoot, 'data', 'uploads');
  const storageDriver =
    (process.env.MEDIA_STORAGE_DRIVER as 'local' | 'minio' | 's3' | undefined) ?? 'local';
  mkdirSync(mediaStorageDir, { recursive: true });
  const mediaStorage = createMediaStorageAdapter(
    mediaStorageDir,
    storageDriver,
  );
  const auditLogsRepository = createSqliteAuditLogsRepository(contentTypesDatabaseFile);
  const schemaMigrationsRepository = createSqliteSchemaMigrationsRepository(contentTypesDatabaseFile);
  const editorEmail = options.editorEmail ?? process.env.EDITOR_EMAIL;
  const editorPassword = options.editorPassword ?? process.env.EDITOR_PASSWORD;
  const viewerEmail = options.viewerEmail ?? process.env.VIEWER_EMAIL;
  const viewerPassword = options.viewerPassword ?? process.env.VIEWER_PASSWORD;
  const auth = createAdminAuthService({
    adminEmail: options.adminEmail ?? process.env.ADMIN_EMAIL ?? DEFAULT_ADMIN_EMAIL,
    adminPassword: options.adminPassword ?? process.env.ADMIN_PASSWORD ?? DEFAULT_ADMIN_PASSWORD,
    authSecret: options.authSecret ?? process.env.AUTH_SECRET ?? DEFAULT_AUTH_SECRET,
    ...(options.ownerEmail && options.ownerPassword
      ? {
          ownerEmail: options.ownerEmail,
          ownerPassword: options.ownerPassword,
        }
      : process.env.OWNER_EMAIL && process.env.OWNER_PASSWORD
        ? {
            ownerEmail: process.env.OWNER_EMAIL,
            ownerPassword: process.env.OWNER_PASSWORD,
          }
        : {}),
    ...(editorEmail && editorPassword
      ? {
          editorEmail,
          editorPassword,
        }
      : {}),
    ...(viewerEmail && viewerPassword
      ? {
          viewerEmail,
          viewerPassword,
        }
      : {}),
  });
  const contentTypesRepository = createSqliteContentTypesRepository(contentTypesDatabaseFile);
  const contentEntriesRepository = createSqliteContentEntriesRepository(contentTypesDatabaseFile);
  const mediaFilesRepository = createSqliteMediaFilesRepository(contentTypesDatabaseFile);
  const rolesRepository = createSqliteRolesRepository(contentTypesDatabaseFile);
  const webhooksRepository = createSqliteWebhooksRepository(contentTypesDatabaseFile);
  ensureSqlitePerformanceIndexes(contentTypesDatabaseFile);
  const webhookEvents = createWebhookEventBus();
  const publicResponseCache = createPublicResponseCache(options.publicResponseCacheTtlMs ?? 5000);
  const realtimeStream = createRealtimeStreamManager();
  const webhookDispatcher = createWebhookDispatcher({
    repository: webhooksRepository,
  });
  const publishScheduler = createContentPublishScheduler({
    audit: auditLogsRepository,
    contentTypesRepository,
    events: webhookEvents,
    repository: contentEntriesRepository,
  });
  const unsubscribeWebhookDispatcher = webhookEvents.subscribe((event) => {
    webhookDispatcher.publish(event);
  });
  const unsubscribeRealtimeStream = webhookEvents.subscribe((event) => {
    realtimeStream.publish(event, contentTypesRepository);
  });
  const unsubscribePublicCacheInvalidator = webhookEvents.subscribe((event) => {
    if (['content-fields', 'content-entries', 'content-types', 'media-files'].includes(event.scope)) {
      publicResponseCache.clear();
    }
  });

  app.addHook('onRequest', async (request, reply) => {
    reply.header('x-request-id', request.id);
    request.log.info(
      {
        method: request.method,
        requestId: request.id,
        url: request.url,
      },
      'request.start',
    );
  });

  app.addHook('onResponse', async (request, reply) => {
    request.log.info(
      {
        method: request.method,
        requestId: request.id,
        statusCode: reply.statusCode,
        url: request.url,
      },
      'request.end',
    );
  });

  app.addHook('onError', async (request, _reply, error) => {
    request.log.error(
      {
        error: error.message,
        method: request.method,
        requestId: request.id,
        url: request.url,
      },
      'request.error',
    );
  });

  await app.register(fastifyStatic, {
    decorateReply: false,
    index: 'index.html',
    prefix: '/docs/',
    root: docsRoot,
  });

  await app.register(fastifyStatic, {
    decorateReply: false,
    index: false,
    prefix: '/uploads/',
    root: mediaStorageDir,
  });

  app.addHook('onClose', async () => {
    auditLogsRepository.close();
    schemaMigrationsRepository.close();
    contentTypesRepository.close();
    contentEntriesRepository.close();
    mediaFilesRepository.close();
    rolesRepository.close();
    realtimeStream.close();
    await webhookDispatcher.close();
    webhooksRepository.close();
    publishScheduler.close();
    unsubscribeWebhookDispatcher();
    unsubscribeRealtimeStream();
    unsubscribePublicCacheInvalidator();
  });

  await registerServerRoutes(app, {
    auth,
    auditLogsRepository,
    backupRoutesOptions: {
      auditLogsRepository,
      contentEntriesRepository,
      contentTypesRepository,
      mediaFilesRepository,
      mediaStorage,
      schemaMigrationsRepository,
      storageDir: mediaStorageDir,
      webhooksRepository,
    },
    contentEntriesRepository,
    contentPublicRouteOptions: {
      mediaFilesRepository,
      previewAuth: auth,
      responseCache: publicResponseCache,
    },
    contentTypesRepository,
    events: webhookEvents,
    mediaFilesRepository,
    mediaStorage,
    rolesRepository,
    realtimeStream,
    schemaMigrationsRepository,
    webhooksRepository,
  });

  await publishScheduler.start();

  app.get('/', async (_request, reply) => {
    return reply.redirect('/docs/');
  });

  app.get('/docs', async (_request, reply) => {
    return reply.redirect('/docs/');
  });

  app.get('/health', async (request) => ({
    docs: '/docs',
    requestId: request.id,
    service: 'apiagex',
    status: 'ok',
  }));

  app.get('/health/detail', async (request) =>
    buildHealthResponse({
      docsReady: existsSync(join(docsRoot, 'index.html')),
      requestId: request.id,
      schedulerRunning: publishScheduler.isRunning(),
      storageDriver,
      uploadsPath: mediaStorageDir,
    }),
  );

  app.get('/docs-health', async () => ({
    docsIndex: join(docsRoot, 'index.html'),
    status: 'ok',
  }));

  return app;
}
