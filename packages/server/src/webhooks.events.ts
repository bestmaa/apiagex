import type { WebhookEvent, WebhookEventBus, WebhookEventName, WebhookEventListener } from './webhooks.events.type.js';

export const WEBHOOK_EVENT_NAMES: readonly WebhookEventName[] = [
  'content-entries.create',
  'content-entries.delete',
  'content-entries.update',
  'content-fields.create',
  'content-fields.delete',
  'content-fields.update',
  'content-types.create',
  'content-types.delete',
  'content-types.update',
  'media-files.create',
  'media-files.delete',
  'media-files.update',
];

export function createWebhookEventBus(): WebhookEventBus {
  const listeners = new Set<WebhookEventListener>();

  return {
    publish(event: WebhookEvent): void {
      for (const listener of listeners) {
        void Promise.resolve(listener(event)).catch(() => undefined);
      }
    },
    subscribe(listener: WebhookEventListener): () => void {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export function createWebhookEventName(scope: WebhookEvent['scope'], action: WebhookEvent['action']): WebhookEventName {
  return `${scope}.${action}` as WebhookEventName;
}

export function isWebhookEventName(value: string): value is WebhookEventName {
  return WEBHOOK_EVENT_NAMES.includes(value as WebhookEventName);
}
