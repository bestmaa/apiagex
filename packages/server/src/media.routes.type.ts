import type { AdminAuthService } from './auth.type.js';
import type { AuditLogRepository } from './audit.type.js';
import type { MediaStorageAdapter } from './media-storage.adapter.type.js';
import type { MediaFilesRepository } from './media.repository.type.js';
import type { WebhookEventBus } from './webhooks.events.type.js';

export interface MediaRoutesOptions {
  auth: AdminAuthService;
  audit: AuditLogRepository;
  events?: WebhookEventBus;
  repository: MediaFilesRepository;
  storage: MediaStorageAdapter;
  storageDir: string;
}

export interface UploadMediaFileInput {
  base64: string;
  filename: string;
  mimeType: string;
}
