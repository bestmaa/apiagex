import type { FastifyInstance } from 'fastify';

import { registerAuthRoutes } from './auth.routes.js';
import { registerAuditLogsRoutes } from './audit-logs.routes.js';
import { registerBackupRoutes } from './backup.routes.js';
import { registerContentEntriesRoutes } from './content-entries.routes.js';
import { registerContentFieldsRoutes } from './content-fields.routes.js';
import { registerContentPreviewRoutes } from './content-preview.routes.js';
import { registerContentPublicRoutes } from './content-public.routes.js';
import { registerContentTypesRoutes } from './content-types.routes.js';
import { registerDocsRoutes } from './docs.routes.js';
import { registerMediaRoutes } from './media.routes.js';
import { registerRolesRoutes } from './roles.routes.js';
import { registerRealtimeRoutes } from './realtime.routes.js';
import { registerSearchRoutes } from './search.routes.js';
import type { RegisterServerRoutesOptions } from './server.routes.type.js';
import { registerWebhookRoutes } from './webhooks.routes.js';

export async function registerServerRoutes(app: FastifyInstance, options: RegisterServerRoutesOptions): Promise<void> {
  await app.register(async (instance) => {
    await registerAuthRoutes(instance, {
      auth: options.auth,
    });
    await registerAuditLogsRoutes(instance, {
      auth: options.auth,
      repository: options.auditLogsRepository,
    });
    const backupRoutesOptions = {
      ...options.backupRoutesOptions,
      auth: options.auth,
      ...(options.contentPublicRouteOptions.responseCache
        ? {
            onRestored: () => {
              options.contentPublicRouteOptions.responseCache?.clear();
            },
          }
        : {}),
    } satisfies Parameters<typeof registerBackupRoutes>[1];

    await registerBackupRoutes(instance, backupRoutesOptions);
    await registerContentTypesRoutes(instance, {
      auth: options.auth,
      audit: options.auditLogsRepository,
      events: options.events,
      repository: options.contentTypesRepository,
    });
    await registerContentFieldsRoutes(instance, {
      auth: options.auth,
      audit: options.auditLogsRepository,
      events: options.events,
      repository: options.contentTypesRepository,
    });
    await registerContentEntriesRoutes(instance, {
      auth: options.auth,
      audit: options.auditLogsRepository,
      contentTypesRepository: options.contentTypesRepository,
      events: options.events,
      mediaFilesRepository: options.mediaFilesRepository,
      repository: options.contentEntriesRepository,
      rolesRepository: options.rolesRepository,
    });
    await registerContentPreviewRoutes(instance, {
      auth: options.auth,
      contentEntriesRepository: options.contentEntriesRepository,
      contentTypesRepository: options.contentTypesRepository,
      rolesRepository: options.rolesRepository,
    });
    await registerDocsRoutes(instance, {
      contentTypesRepository: options.contentTypesRepository,
    });
    await registerMediaRoutes(instance, {
      auth: options.auth,
      audit: options.auditLogsRepository,
      events: options.events,
      repository: options.mediaFilesRepository,
      storage: options.mediaStorage,
      storageDir: options.backupRoutesOptions.storageDir,
    });
    await registerRolesRoutes(instance, {
      auth: options.auth,
      repository: options.rolesRepository,
    });
    await registerSearchRoutes(instance, {
      auth: options.auth,
      contentEntriesRepository: options.contentEntriesRepository,
      contentTypesRepository: options.contentTypesRepository,
      mediaFilesRepository: options.mediaFilesRepository,
      rolesRepository: options.rolesRepository,
    });
    await registerWebhookRoutes(instance, {
      auth: options.auth,
      events: options.events,
      repository: options.webhooksRepository,
    });
    await registerRealtimeRoutes(instance, {
      manager: options.realtimeStream,
    });
    await registerContentPublicRoutes(instance, {
      ...options.contentPublicRouteOptions,
      contentEntriesRepository: options.contentEntriesRepository,
      contentTypesRepository: options.contentTypesRepository,
      rolesRepository: options.rolesRepository,
    });
  });
}
