import type { WebhookEventBus, WebhookEvent } from './webhooks.events.type.js';
import type { WebhooksRepository } from './webhooks.repository.type.js';

export interface WebhookDispatcher {
  close(): Promise<void>;
  publish(event: WebhookEvent): void;
}

export interface WebhookDispatcherOptions {
  repository: WebhooksRepository;
  retryDelaysMs?: readonly number[];
}

export type { WebhookEventBus, WebhookEvent, WebhooksRepository };
