import type { AuditLogRecord } from './audit.type.js';
import type { ContentEntryRecord, ContentEntryVersionRecord } from './content-entries.routes.type.js';
import type { ContentTypeRecord } from './content-types.routes.type.js';
import type { MediaFileRecord } from './media.repository.type.js';
import type { SchemaMigrationRecord } from './schema-migrations.repository.type.js';
import type { WebhookDeliveryRecord, WebhookRecord } from './webhooks.repository.type.js';

export interface BackupBundle {
  auditLogs: readonly AuditLogRecord[];
  contentTypes: readonly ContentTypeRecord[];
  entries: readonly ContentEntryRecord[];
  entryVersions: readonly ContentEntryVersionRecord[];
  exportedAt: string;
  mediaFiles: readonly (MediaFileRecord & { contentBase64: string })[];
  schemaMigrations: readonly SchemaMigrationRecord[];
  version: 1;
  webhooks: {
    deliveries: readonly WebhookDeliveryRecord[];
    items: readonly WebhookRecord[];
  };
}

export interface RestoreSummary {
  auditLogs: number;
  contentTypes: number;
  entries: number;
  mediaFiles: number;
  schemaMigrations: number;
  webhooks: number;
}
