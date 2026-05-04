import type { AdminAuthService } from './auth.type.js';
import type { AuditLogRepository } from './audit.type.js';
import type { BackupRoutesOptions } from './backup.service.type.js';
import type { ContentEntriesRepository } from './content-entries.routes.type.js';
import type { ContentTypesRepository } from './content-types.repository.type.js';
import type { ContentPublicRouteOptions } from './content-public.routes.type.js';
import type { MediaFilesRepository } from './media.repository.type.js';
import type { MediaStorageAdapter } from './media-storage.adapter.type.js';
import type { RolesRepository } from './roles.repository.type.js';
import type { RealtimeStreamManager } from './realtime.service.type.js';
import type { SchemaMigrationsRepository } from './schema-migrations.repository.type.js';
import type { WebhookEventBus } from './webhooks.events.type.js';
import type { WebhooksRepository } from './webhooks.repository.type.js';

export interface RegisterServerRoutesOptions {
  auth: AdminAuthService;
  auditLogsRepository: AuditLogRepository;
  backupRoutesOptions: Omit<BackupRoutesOptions, 'auth' | 'onRestored'>;
  contentEntriesRepository: ContentEntriesRepository;
  contentTypesRepository: ContentTypesRepository;
  contentPublicRouteOptions: Omit<
    ContentPublicRouteOptions,
    'contentEntriesRepository' | 'contentTypesRepository' | 'rolesRepository'
  >;
  events: WebhookEventBus;
  mediaFilesRepository: MediaFilesRepository;
  mediaStorage: MediaStorageAdapter;
  rolesRepository: RolesRepository;
  realtimeStream: RealtimeStreamManager;
  schemaMigrationsRepository: SchemaMigrationsRepository;
  webhooksRepository: WebhooksRepository;
}
