import { createHmac } from 'node:crypto';

import type { WebhookEvent } from './webhooks.events.type.js';
import { matchesWebhookFilters } from './webhooks.filters.js';
import type { WebhookDispatcher, WebhookDispatcherOptions } from './webhooks.dispatcher.type.js';
import type { WebhookDeliveryRecord, WebhookRecord } from './webhooks.repository.type.js';

const DEFAULT_RETRY_DELAYS_MS = [250, 1000, 2500] as const;

export function createWebhookDispatcher(options: WebhookDispatcherOptions): WebhookDispatcher {
  const retryDelaysMs = options.retryDelaysMs ?? DEFAULT_RETRY_DELAYS_MS;
  const timers = new Set<SleepEntry>();
  const activeDeliveries = new Set<Promise<void>>();
  let closed = false;

  return {
    async close(): Promise<void> {
      closed = true;
      timers.forEach((entry) => {
        clearTimeout(entry.handle);
        entry.resolve();
      });
      timers.clear();
      await Promise.allSettled(activeDeliveries);
    },
    publish(event: WebhookEvent): void {
      const deliveryTask = deliverEvent(options.repository, event, retryDelaysMs, timers, () => closed);
      activeDeliveries.add(deliveryTask);
      void deliveryTask.finally(() => {
        activeDeliveries.delete(deliveryTask);
      });
    },
  };
}

async function deliverEvent(
  repository: WebhookDispatcherOptions['repository'],
  event: WebhookEvent,
  retryDelaysMs: readonly number[],
  timers: Set<SleepEntry>,
  isClosed: () => boolean,
): Promise<void> {
  for (const webhook of repository.listEnabledByEvent(event.name).filter((candidate) => matchesWebhookFilters(candidate.filters, event))) {
    const delivery = repository.createDelivery({
      attempt: 1,
      eventName: event.name,
      requestBody: JSON.stringify(event),
      status: 'pending',
      webhookId: webhook.id,
    });

    await deliverWithRetry(repository, webhook, delivery, event, retryDelaysMs, timers, isClosed);
  }
}

async function deliverWithRetry(
  repository: WebhookDispatcherOptions['repository'],
  webhook: WebhookRecord,
  delivery: WebhookDeliveryRecord,
  event: WebhookEvent,
  retryDelaysMs: readonly number[],
  timers: Set<SleepEntry>,
  isClosed: () => boolean,
): Promise<void> {
  const requestBody = delivery.requestBody;

  for (let attempt = 1; attempt <= retryDelaysMs.length + 1; attempt += 1) {
    if (isClosed()) {
      return;
    }

    const response = await sendWebhook(webhook, event, requestBody);

    if (response.ok) {
      repository.updateDelivery(delivery.id, {
        attempt,
        deliveredAt: new Date().toISOString(),
        errorMessage: null,
        nextRetryAt: null,
        responseBody: response.body,
        status: 'delivered',
        statusCode: response.statusCode,
      });
      return;
    }

    const isLastAttempt = attempt >= retryDelaysMs.length + 1;
    const retryDelay = retryDelaysMs[attempt - 1] ?? 0;

    repository.updateDelivery(delivery.id, {
      attempt,
      errorMessage: response.errorMessage ?? null,
      nextRetryAt: isLastAttempt ? null : new Date(Date.now() + retryDelay).toISOString(),
      responseBody: response.body,
      status: isLastAttempt ? 'failed' : 'retrying',
      statusCode: response.statusCode,
    });

    if (isLastAttempt || isClosed()) {
      return;
    }

    await sleep(retryDelay, timers, isClosed);
  }
}

async function sendWebhook(
  webhook: WebhookRecord,
  event: WebhookEvent,
  requestBody: string,
): Promise<{ body: string; errorMessage?: string; ok: boolean; statusCode: number }> {
  const headers = new Headers({
    'content-type': 'application/json; charset=utf-8',
    'x-apiagex-event': event.name,
    'x-apiagex-webhook-id': webhook.id,
  });

  if (webhook.secret) {
    headers.set('x-apiagex-signature', createHmac('sha256', webhook.secret).update(requestBody).digest('hex'));
  }

  try {
    const response = await fetch(webhook.targetUrl, {
      body: requestBody,
      headers,
      method: 'POST',
    });
    const body = await response.text();

    return {
      body,
      ok: response.ok,
      statusCode: response.status,
    };
  } catch (error) {
    return {
      body: '',
      errorMessage: error instanceof Error ? error.message : 'Webhook delivery failed',
      ok: false,
      statusCode: 0,
    };
  }
}

async function sleep(
  delayMs: number,
  timers: Set<SleepEntry>,
  isClosed: () => boolean,
): Promise<void> {
  if (isClosed() || delayMs <= 0) {
    return;
  }

  await new Promise<void>((resolve) => {
    const entry: SleepEntry = {
      handle: setTimeout(() => {
        timers.delete(entry);
        resolve();
      }, delayMs),
      resolve,
    };
    timers.add(entry);
  });
}

interface SleepEntry {
  handle: ReturnType<typeof setTimeout>;
  resolve: () => void;
}
