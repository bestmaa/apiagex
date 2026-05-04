import type { FastifyInstance } from 'fastify';

import { createAdminOnlyGuard } from './permissions.js';
import { parseWebhookFilters } from './webhooks.filters.js';
import { isWebhookEventName, WEBHOOK_EVENT_NAMES } from './webhooks.events.js';
import type { WebhookRoutesOptions, WebhookInput } from './webhooks.routes.type.js';

export async function registerWebhookRoutes(
  app: FastifyInstance,
  options: WebhookRoutesOptions,
): Promise<void> {
  const store = options.repository;
  const adminGuard = createAdminOnlyGuard(options.auth);

  app.get('/admin/webhooks', { preHandler: adminGuard }, async () => ({
    items: store.list(),
    status: 'ok',
  }));

  app.get('/admin/webhooks/:id/deliveries', { preHandler: adminGuard }, async (request, reply) => {
    const { id } = request.params as { id: string };

    if (!store.get(id)) {
      return reply.code(404).send({ message: 'Webhook not found' });
    }

    return {
      items: store.listDeliveries(id),
      status: 'ok',
    };
  });

  app.post('/admin/webhooks', { preHandler: adminGuard }, async (request, reply) => {
    const input = request.body as Partial<WebhookInput>;
    const normalized = normalizeWebhookInput(input);

    if (!normalized) {
      return reply.code(400).send({ message: 'Invalid webhook input' });
    }

    return reply.code(201).send(store.create(normalized));
  });

  app.put('/admin/webhooks/:id', { preHandler: adminGuard }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const input = request.body as Partial<WebhookInput>;
    const normalized = normalizeWebhookInput(input);

    if (!normalized) {
      return reply.code(400).send({ message: 'Invalid webhook input' });
    }

    const record = store.update(id, normalized);

    if (!record) {
      return reply.code(404).send({ message: 'Webhook not found' });
    }

    return reply.send(record);
  });

  app.delete('/admin/webhooks/:id', { preHandler: adminGuard }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const deleted = store.delete(id);

    if (!deleted) {
      return reply.code(404).send({ message: 'Webhook not found' });
    }

    return reply.code(204).send();
  });
}

function normalizeWebhookInput(input: Partial<WebhookInput>): WebhookInput | null {
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const targetUrl = typeof input.targetUrl === 'string' ? input.targetUrl.trim() : '';
  const secret = typeof input.secret === 'string' && input.secret.trim() ? input.secret.trim() : undefined;
  const enabled = typeof input.enabled === 'boolean' ? input.enabled : true;
  const events = Array.isArray(input.events)
    ? input.events.filter((event): event is WebhookInput['events'][number] => typeof event === 'string' && isWebhookEventName(event))
    : [];

  if (!name || !targetUrl || !events.length) {
    return null;
  }

  const filters = parseWebhookFilters(input.filters);

  if (!filters) {
    return null;
  }

  try {
    const url = new URL(targetUrl);

    if (!['http:', 'https:'].includes(url.protocol)) {
      return null;
    }
  } catch {
    return null;
  }

  return {
    enabled,
    filters,
    events,
    name,
    secret,
    targetUrl,
  };
}

export { WEBHOOK_EVENT_NAMES };
