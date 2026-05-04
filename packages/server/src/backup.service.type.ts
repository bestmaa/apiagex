import type { AdminAuthService } from './auth.type.js';
import type { AuditLogRepository } from './audit.type.js';
import type { ContentEntriesRepository } from './content-entries.routes.type.js';
import type { ContentTypesRepository } from './content-types.repository.type.js';
import type { MediaStorageAdapter } from './media-storage.adapter.type.js';
import type { MediaFilesRepository } from './media.repository.type.js';
import type { SchemaMigrationsRepository } from './schema-migrations.repository.type.js';
import type { WebhooksRepository } from './webhooks.repository.type.js';

export interface BackupServiceOptions {
  auditLogsRepository: AuditLogRepository;
  contentEntriesRepository: ContentEntriesRepository;
  contentTypesRepository: ContentTypesRepository;
  mediaFilesRepository: MediaFilesRepository;
  mediaStorage: MediaStorageAdapter;
  schemaMigrationsRepository: SchemaMigrationsRepository;
  storageDir: string;
  webhooksRepository: WebhooksRepository;
}

export interface BackupRoutesOptions extends BackupServiceOptions {
  auth: AdminAuthService;
  onRestored?: () => void;
}
