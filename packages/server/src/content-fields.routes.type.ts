import type { AdminAuthService } from './auth.type.js';
import type { AuditLogRepository } from './audit.type.js';
import type { ContentFieldRecord } from './content-types.routes.type.js';
import type { ContentTypesRepository } from './content-types.repository.type.js';
import type { WebhookEventBus } from './webhooks.events.type.js';

export interface ContentFieldsRouteOptions {
  auth: AdminAuthService;
  audit: AuditLogRepository;
  events?: WebhookEventBus;
  repository: ContentTypesRepository;
}

export type { ContentFieldRecord };
