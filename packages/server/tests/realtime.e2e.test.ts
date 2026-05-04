import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildServer } from '../src/app.js';
import { bearerHeaders, loginAdmin } from './auth-test-utils.js';

describe('realtime end to end', () => {
  it('streams create events only when the create action is enabled', async () => {
    const databaseFile = join(await mkdtemp(join(tmpdir(), 'apiagex-server-')), 'realtime.db');
    const app = await buildServer({ contentTypesDatabaseFile: databaseFile, logger: false });
    const token = await loginAdmin(app);
    const baseUrl = await startServer(app);

    const stream = await fetch(`${baseUrl}/realtime/stream?contentTypes=articles`);
    const collector = await startSseCollector(stream);

    await collector.waitFor((event) => event.event === 'ready');

    const created = await createContentType(app, token, {
      displayName: 'Article',
      fields: [],
      kind: 'collection',
      realtimeActions: {
        create: true,
        delete: false,
        update: false,
      },
      realtimeEnabled: true,
      slug: 'articles',
    });

    expect(created.statusCode).toBe(201);
    await collector.waitFor((event) => event.data.action === 'create' && event.data.contentTypeSlug === 'articles');

    const countAfterCreate = collector.events.length;

    const updated = await updateContentType(app, token, {
      displayName: 'Article Updated',
      fields: [],
      kind: 'collection',
      realtimeActions: {
        create: true,
        delete: false,
        update: false,
      },
      realtimeEnabled: true,
      slug: 'articles',
    });
    const deleted = await deleteContentType(app, token, 'articles');

    expect(updated.statusCode).toBe(200);
    expect(deleted.statusCode).toBe(204);

    await sleep(250);
    expect(collector.events.length).toBe(countAfterCreate);

    await collector.stop();
    await app.close();
  });

  it('does not publish anything when realtimeEnabled is false', async () => {
    const databaseFile = join(await mkdtemp(join(tmpdir(), 'apiagex-server-')), 'realtime.db');
    const app = await buildServer({ contentTypesDatabaseFile: databaseFile, logger: false });
    const token = await loginAdmin(app);
    const baseUrl = await startServer(app);

    const stream = await fetch(`${baseUrl}/realtime/stream?contentTypes=archives`);
    const collector = await startSseCollector(stream);

    await collector.waitFor((event) => event.event === 'ready');

    const created = await createContentType(app, token, {
      displayName: 'Archive',
      fields: [],
      kind: 'collection',
      realtimeActions: {
        create: true,
        delete: true,
        update: true,
      },
      realtimeEnabled: false,
      slug: 'archives',
    });

    expect(created.statusCode).toBe(201);
    await sleep(250);
    expect(collector.events).toHaveLength(1);
    expect(collector.events[0]).toMatchObject({
      event: 'ready',
    });

    await collector.stop();
    await app.close();
  });

  it('falls back for legacy content types without realtimeActions', async () => {
    const databaseFile = join(await mkdtemp(join(tmpdir(), 'apiagex-server-')), 'realtime.db');
    const app = await buildServer({ contentTypesDatabaseFile: databaseFile, logger: false });
    const token = await loginAdmin(app);
    const baseUrl = await startServer(app);

    const stream = await fetch(`${baseUrl}/realtime/stream?contentTypes=legacy-articles`);
    const collector = await startSseCollector(stream);

    await collector.waitFor((event) => event.event === 'ready');

    const created = await createContentType(app, token, {
      displayName: 'Legacy Article',
      fields: [],
      kind: 'collection',
      realtimeEnabled: true,
      slug: 'legacy-articles',
    });

    expect(created.statusCode).toBe(201);
    await collector.waitFor((event) => event.data.action === 'create' && event.data.contentTypeSlug === 'legacy-articles');

    await collector.stop();
    await app.close();
  });
});

async function startServer(app: Awaited<ReturnType<typeof buildServer>>): Promise<string> {
  await app.listen({ host: '127.0.0.1', port: 0 });
  const address = app.server.address();

  if (!address || typeof address === 'string') {
    throw new Error('Unable to start realtime test server');
  }

  return `http://127.0.0.1:${address.port}`;
}

async function createContentType(
  app: Awaited<ReturnType<typeof buildServer>>,
  token: string,
  payload: Record<string, unknown>,
): Promise<{ statusCode: number }> {
  return app.inject({
    headers: bearerHeaders(token),
    method: 'POST',
    url: '/admin/content-types',
    payload,
  }) as unknown as { statusCode: number };
}

async function updateContentType(
  app: Awaited<ReturnType<typeof buildServer>>,
  token: string,
  payload: Record<string, unknown>,
): Promise<{ statusCode: number }> {
  return app.inject({
    headers: bearerHeaders(token),
    method: 'PUT',
    url: '/admin/content-types/articles',
    payload,
  }) as unknown as { statusCode: number };
}

async function deleteContentType(
  app: Awaited<ReturnType<typeof buildServer>>,
  token: string,
  id: string,
): Promise<{ statusCode: number }> {
  return app.inject({
    headers: bearerHeaders(token),
    method: 'DELETE',
    url: `/admin/content-types/${encodeURIComponent(id)}`,
  }) as unknown as { statusCode: number };
}

async function startSseCollector(response: globalThis.Response) {
  if (!response.body) {
    throw new Error('SSE response did not provide a body');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const events: Array<{ data: Record<string, unknown>; event: string }> = [];
  let buffer = '';

  const pump = (async () => {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      let separatorIndex = buffer.indexOf('\n\n');

      while (separatorIndex >= 0) {
        const block = buffer.slice(0, separatorIndex);
        buffer = buffer.slice(separatorIndex + 2);
        const event = parseSseBlock(block);

        if (event) {
          events.push(event);
        }

        separatorIndex = buffer.indexOf('\n\n');
      }
    }
  })();

  return {
    events,
    async stop() {
      await reader.cancel().catch(() => undefined);
      await pump.catch(() => undefined);
    },
    async waitFor(predicate: (event: { data: Record<string, unknown>; event: string }) => boolean, timeoutMs = 2000) {
      const startedAt = Date.now();

      while (Date.now() - startedAt < timeoutMs) {
        if (events.some(predicate)) {
          return;
        }

        await sleep(25);
      }

      throw new Error(`Timed out waiting for SSE event after ${timeoutMs}ms`);
    },
  };
}

function parseSseBlock(block: string): { data: Record<string, unknown>; event: string } | null {
  let event = 'message';
  const dataLines: string[] = [];

  for (const line of block.split('\n')) {
    if (line.startsWith('event: ')) {
      event = line.slice('event: '.length).trim() || 'message';
      continue;
    }

    if (line.startsWith('data: ')) {
      dataLines.push(line.slice('data: '.length));
    }
  }

  if (!dataLines.length) {
    return null;
  }

  try {
    return {
      data: JSON.parse(dataLines.join('\n')),
      event,
    };
  } catch {
    return null;
  }
}

async function sleep(ms: number): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, ms));
}
