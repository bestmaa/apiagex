import { createServer, type IncomingMessage } from 'node:http';
import { createHmac } from 'node:crypto';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildServer } from '../src/app.js';
import { bearerHeaders, loginAdmin } from './auth-test-utils.js';

describe('webhooks routes', () => {
  it('retries failed webhook deliveries with backoff and stores delivery status', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'apiagex-webhooks-'));
    const databaseFile = join(workspace, 'content-types.db');
    const requests: Array<{ body: string; headers: IncomingMessage['headers'] }> = [];
    const webhookServer = createServer(async (request, response) => {
      const body = await readRequestBody(request);
      requests.push({
        body,
        headers: request.headers,
      });
      response.statusCode = requests.length === 1 ? 503 : 200;
      response.end(requests.length === 1 ? 'retry' : 'ok');
    });

    await listen(webhookServer);

    const address = webhookServer.address();
    if (typeof address !== 'object' || !address) {
      throw new Error('Webhook server did not start');
    }

    const webhookUrl = `http://127.0.0.1:${address.port}/hook`;
    const app = await buildServer({ contentTypesDatabaseFile: databaseFile, logger: false });
    const token = await loginAdmin(app);

    const createdWebhook = await app.inject({
      headers: bearerHeaders(token),
      method: 'POST',
      url: '/admin/webhooks',
      payload: {
        enabled: true,
        events: ['content-types.create'],
        name: 'Content types',
        secret: 'webhook-secret',
        targetUrl: webhookUrl,
      },
    });

    const createdContentType = await app.inject({
      headers: bearerHeaders(token),
      method: 'POST',
      url: '/admin/content-types',
      payload: {
        displayName: 'Article',
        fields: [],
        kind: 'collection',
        slug: 'articles',
      },
    });

    await waitFor(async () => requests.length >= 2);

    expect(createdWebhook.statusCode).toBe(201);
    expect(createdContentType.statusCode).toBe(201);
    expect(requests).toHaveLength(2);
    expect(requests[0].headers['x-apiagex-event']).toBe('content-types.create');
    expect(requests[0].headers['x-apiagex-webhook-id']).toBe(createdWebhook.json().id);
    expect(requests[0].headers['x-apiagex-signature']).toBe(
      createHmac('sha256', 'webhook-secret').update(requests[0].body).digest('hex'),
    );
    expect(JSON.parse(requests[0].body)).toMatchObject({
      action: 'create',
      name: 'content-types.create',
      scope: 'content-types',
      subjectId: createdContentType.json().id,
    });
    await waitFor(async () => {
      const response = await app.inject({
        headers: bearerHeaders(token),
        method: 'GET',
        url: `/admin/webhooks/${createdWebhook.json().id}/deliveries`,
      });
      const items = response.json().items as Array<{ attempt: number; status: string; statusCode: number }>;

      return items[0]?.status === 'delivered' && items[0]?.attempt === 2 && items[0]?.statusCode === 200;
    });

    const deliveries = await app.inject({
      headers: bearerHeaders(token),
      method: 'GET',
      url: `/admin/webhooks/${createdWebhook.json().id}/deliveries`,
    });

    await app.close();
    webhookServer.close();

    expect(deliveries.statusCode).toBe(200);
    expect(deliveries.json()).toMatchObject({
      items: [
        {
          eventName: 'content-types.create',
          status: 'delivered',
          attempt: 2,
          statusCode: 200,
        },
      ],
    });
  });

  it('preserves old behavior when filters are empty', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'apiagex-webhooks-empty-filters-'));
    const databaseFile = join(workspace, 'content-types.db');
    const requests: Array<{ body: string; headers: IncomingMessage['headers'] }> = [];
    const webhookServer = createServer(async (request, response) => {
      const body = await readRequestBody(request);
      requests.push({
        body,
        headers: request.headers,
      });
      response.statusCode = 200;
      response.end('ok');
    });

    await listen(webhookServer);

    const address = webhookServer.address();
    if (typeof address !== 'object' || !address) {
      throw new Error('Webhook server did not start');
    }

    const webhookUrl = `http://127.0.0.1:${address.port}/hook`;
    const app = await buildServer({ contentTypesDatabaseFile: databaseFile, logger: false });
    const token = await loginAdmin(app);

    const createdWebhook = await app.inject({
      headers: bearerHeaders(token),
      method: 'POST',
      url: '/admin/webhooks',
      payload: {
        enabled: true,
        events: ['content-types.create'],
        name: 'Legacy webhook',
        targetUrl: webhookUrl,
      },
    });

    const createdContentType = await app.inject({
      headers: bearerHeaders(token),
      method: 'POST',
      url: '/admin/content-types',
      payload: {
        displayName: 'Article',
        fields: [],
        kind: 'collection',
        slug: 'articles',
      },
    });

    await waitFor(async () => requests.length >= 1);

    const deliveries = await app.inject({
      headers: bearerHeaders(token),
      method: 'GET',
      url: `/admin/webhooks/${createdWebhook.json().id}/deliveries`,
    });

    await app.close();
    webhookServer.close();

    expect(createdWebhook.statusCode).toBe(201);
    expect(createdContentType.statusCode).toBe(201);
    expect(requests).toHaveLength(1);
    expect(requests[0].headers['x-apiagex-event']).toBe('content-types.create');
    expect(deliveries.statusCode).toBe(200);
    expect(deliveries.json()).toMatchObject({
      items: [
        {
          eventName: 'content-types.create',
          status: 'delivered',
        },
      ],
    });
  });

  it('filters webhook deliveries by content type and action', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'apiagex-webhooks-filters-'));
    const databaseFile = join(workspace, 'content-types.db');
    const requests: Array<{ body: string; headers: IncomingMessage['headers'] }> = [];
    const webhookServer = createServer(async (request, response) => {
      const body = await readRequestBody(request);
      requests.push({
        body,
        headers: request.headers,
      });
      response.statusCode = 200;
      response.end('ok');
    });

    await listen(webhookServer);

    const address = webhookServer.address();
    if (typeof address !== 'object' || !address) {
      throw new Error('Webhook server did not start');
    }

    const webhookUrl = `http://127.0.0.1:${address.port}/hook`;
    const app = await buildServer({ contentTypesDatabaseFile: databaseFile, logger: false });
    const token = await loginAdmin(app);

    await app.inject({
      headers: bearerHeaders(token),
      method: 'POST',
      url: '/admin/webhooks',
      payload: {
        enabled: true,
        events: ['content-entries.create', 'content-entries.update', 'content-entries.delete'],
        filters: {
          actions: ['create', 'delete'],
          contentTypeIds: ['articles'],
        },
        name: 'Article entry webhook',
        targetUrl: webhookUrl,
      },
    });

    await app.inject({
      headers: bearerHeaders(token),
      method: 'POST',
      url: '/admin/content-types',
      payload: {
        displayName: 'Article',
        fields: [],
        kind: 'collection',
        slug: 'articles',
      },
    });

    await app.inject({
      headers: bearerHeaders(token),
      method: 'POST',
      url: '/admin/content-types',
      payload: {
        displayName: 'Comment',
        fields: [],
        kind: 'collection',
        slug: 'comments',
      },
    });

    const articleCreated = await app.inject({
      headers: bearerHeaders(token),
      method: 'POST',
      url: '/admin/content-types/articles/entries',
      payload: {
        data: {},
        status: 'published',
      },
    });

    await waitFor(async () => requests.length >= 1);

    const articleEntryId = articleCreated.json().id as string;

    await app.inject({
      headers: bearerHeaders(token),
      method: 'PUT',
      url: `/admin/content-types/articles/entries/${articleEntryId}`,
      payload: {
        data: {},
        status: 'published',
      },
    });

    await app.inject({
      headers: bearerHeaders(token),
      method: 'POST',
      url: '/admin/content-types/comments/entries',
      payload: {
        data: {},
        status: 'published',
      },
    });

    await app.inject({
      headers: bearerHeaders(token),
      method: 'DELETE',
      url: `/admin/content-types/articles/entries/${articleEntryId}`,
    });

    await waitFor(async () => requests.length >= 2);

    const webhooks = await app.inject({
      headers: bearerHeaders(token),
      method: 'GET',
      url: '/admin/webhooks',
    });
    const deliveries = await app.inject({
      headers: bearerHeaders(token),
      method: 'GET',
      url: `/admin/webhooks/${webhooks.json().items[0].id}/deliveries`,
    });

    await app.close();
    webhookServer.close();

    expect(requests).toHaveLength(2);
    expect(JSON.parse(requests[0].body)).toMatchObject({
      action: 'create',
      name: 'content-entries.create',
      scope: 'content-entries',
      subjectId: articleEntryId,
    });
    expect(JSON.parse(requests[1].body)).toMatchObject({
      action: 'delete',
      name: 'content-entries.delete',
      scope: 'content-entries',
      subjectId: articleEntryId,
    });
    expect(deliveries.statusCode).toBe(200);
    const deliveryItems = deliveries.json().items as Array<{ eventName: string; status: string }>;
    expect(deliveryItems.map((item) => item.eventName).sort()).toEqual(['content-entries.create', 'content-entries.delete']);
    expect(deliveryItems.every((item) => item.status === 'delivered')).toBe(true);
  });

  it('applies action filters independently for update events', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'apiagex-webhooks-update-filter-'));
    const databaseFile = join(workspace, 'content-types.db');
    const requests: Array<{ body: string; headers: IncomingMessage['headers'] }> = [];
    const webhookServer = createServer(async (request, response) => {
      const body = await readRequestBody(request);
      requests.push({
        body,
        headers: request.headers,
      });
      response.statusCode = 200;
      response.end('ok');
    });

    await listen(webhookServer);

    const address = webhookServer.address();
    if (typeof address !== 'object' || !address) {
      throw new Error('Webhook server did not start');
    }

    const webhookUrl = `http://127.0.0.1:${address.port}/hook`;
    const app = await buildServer({ contentTypesDatabaseFile: databaseFile, logger: false });
    const token = await loginAdmin(app);

    await app.inject({
      headers: bearerHeaders(token),
      method: 'POST',
      url: '/admin/webhooks',
      payload: {
        enabled: true,
        events: ['content-entries.create', 'content-entries.update', 'content-entries.delete'],
        filters: {
          actions: ['update'],
          contentTypeIds: ['articles'],
        },
        name: 'Article update webhook',
        targetUrl: webhookUrl,
      },
    });

    await app.inject({
      headers: bearerHeaders(token),
      method: 'POST',
      url: '/admin/content-types',
      payload: {
        displayName: 'Article',
        fields: [],
        kind: 'collection',
        slug: 'articles',
      },
    });

    const articleCreated = await app.inject({
      headers: bearerHeaders(token),
      method: 'POST',
      url: '/admin/content-types/articles/entries',
      payload: {
        data: {},
        status: 'published',
      },
    });

    const articleEntryId = articleCreated.json().id as string;

    await app.inject({
      headers: bearerHeaders(token),
      method: 'PUT',
      url: `/admin/content-types/articles/entries/${articleEntryId}`,
      payload: {
        data: {},
        status: 'published',
      },
    });

    await app.inject({
      headers: bearerHeaders(token),
      method: 'DELETE',
      url: `/admin/content-types/articles/entries/${articleEntryId}`,
    });

    await waitFor(async () => requests.length >= 1);

    const webhooks = await app.inject({
      headers: bearerHeaders(token),
      method: 'GET',
      url: '/admin/webhooks',
    });
    const deliveries = await app.inject({
      headers: bearerHeaders(token),
      method: 'GET',
      url: `/admin/webhooks/${webhooks.json().items[0].id}/deliveries`,
    });

    await app.close();
    webhookServer.close();

    expect(requests).toHaveLength(1);
    expect(JSON.parse(requests[0].body)).toMatchObject({
      action: 'update',
      name: 'content-entries.update',
      scope: 'content-entries',
      subjectId: articleEntryId,
    });
    expect(deliveries.statusCode).toBe(200);
    expect(deliveries.json()).toMatchObject({
      items: [
        {
          eventName: 'content-entries.update',
          status: 'delivered',
        },
      ],
    });
  });
});

async function readRequestBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString('utf8');
}

async function listen(server: ReturnType<typeof createServer>): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });
}

async function waitFor(predicate: () => boolean | Promise<boolean>): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (await predicate()) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  throw new Error('Timed out waiting for webhook delivery');
}
