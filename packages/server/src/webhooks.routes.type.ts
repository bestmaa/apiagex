import type { AdminAuthService } from './auth.type.js';
import type { WebhookEventBus } from './webhooks.events.type.js';
import type { WebhookInput, WebhooksRepository } from './webhooks.repository.type.js';

export interface WebhookRoutesOptions {
  auth: AdminAuthService;
  events: WebhookEventBus;
  repository: WebhooksRepository;
}

export type { WebhookInput };
