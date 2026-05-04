import { describe, expect, it } from 'vitest';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { buildServer } from '../src/app.js';
import { bearerHeaders, loginAdmin, loginEditor } from './auth-test-utils.js';

describe('buildServer', () => {
  it('serves health status with docs link', async () => {
    const app = await buildServer({ logger: false });
    const response = await app.inject({
      headers: {
        'x-request-id': 'request-health-1',
      },
      method: 'GET',
      url: '/health',
    });
    const detailResponse = await app.inject({
      headers: {
        'x-request-id': 'request-health-2',
      },
      method: 'GET',
      url: '/health/detail',
    });

    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      docs: '/docs',
      requestId: 'request-health-1',
      service: 'apiagex',
      status: 'ok',
    });
    expect(detailResponse.statusCode).toBe(200);
    expect(detailResponse.headers['x-request-id']).toBe('request-health-2');
    expect(detailResponse.json()).toMatchObject({
      docs: '/docs',
      checks: {
        database: 'ready',
        docs: 'ready',
        scheduler: 'running',
        uploads: 'ready',
      },
      requestId: 'request-health-2',
      requestIdHeader: 'x-request-id',
      scheduler: {
        status: 'running',
      },
      service: 'apiagex',
      status: 'ok',
      storage: {
        driver: 'local',
      },
    });
  });

  it('serves the docs page from the API server', async () => {
    const app = await buildServer({ logger: false });
    const response = await app.inject({ method: 'GET', url: '/docs/' });

    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
    expect(response.body).toContain('Apiagex Docs');
  });

  it('requires authentication for admin routes', async () => {
    const app = await buildServer({ logger: false });
    const unauthorized = await app.inject({ method: 'GET', url: '/admin/content-types' });
    const token = await loginAdmin(app);
    const authorized = await app.inject({
      headers: bearerHeaders(token),
      method: 'GET',
      url: '/admin/content-types',
    });

    await app.close();

    expect(unauthorized.statusCode).toBe(401);
    expect(authorized.statusCode).toBe(200);
  });

  it('allows editors to read admin lists but blocks content type writes', async () => {
    const databaseFile = join(await mkdtemp(join(tmpdir(), 'apiagex-app-')), 'content-types.db');
    const app = await buildServer({
      contentTypesDatabaseFile: databaseFile,
      editorEmail: 'editor@example.com',
      editorPassword: 'editor123',
      logger: false,
    });
    const adminToken = await loginAdmin(app);
    await app.inject({
      headers: bearerHeaders(adminToken),
      method: 'POST',
      url: '/admin/content-types',
      payload: {
        displayName: 'Article',
        fields: [],
        kind: 'collection',
        slug: 'articles',
      },
    });

    const editorToken = await loginEditor(app);
    const readable = await app.inject({
      headers: bearerHeaders(editorToken),
      method: 'GET',
      url: '/admin/content-types',
    });
    const blocked = await app.inject({
      headers: bearerHeaders(editorToken),
      method: 'POST',
      url: '/admin/content-types',
      payload: {
        displayName: 'Page',
        fields: [],
        kind: 'single',
        slug: 'pages',
      },
    });

    await app.close();

    expect(readable.statusCode).toBe(200);
    expect(blocked.statusCode).toBe(403);
    expect(blocked.json()).toMatchObject({
      message: 'Forbidden',
    });
  });

  it('exposes content types for the dynamic docs page', async () => {
    const databaseFile = join(await mkdtemp(join(tmpdir(), 'apiagex-app-')), 'content-types.db');
    const app = await buildServer({
      contentTypesDatabaseFile: databaseFile,
      logger: false,
    });
    const adminToken = await loginAdmin(app);

    await app.inject({
      headers: bearerHeaders(adminToken),
      method: 'POST',
      url: '/admin/content-types',
      payload: {
        displayName: 'Article',
        fields: [],
        kind: 'collection',
        permissions: {
          create: ['admin', 'editor'],
          delete: ['admin'],
          list: ['admin', 'editor', 'viewer'],
          read: ['admin', 'editor', 'viewer'],
          update: ['admin'],
        },
        realtimeActions: {
          create: true,
          delete: false,
          update: true,
        },
        realtimeEnabled: true,
        slug: 'articles',
      },
    });

    const response = await app.inject({ method: 'GET', url: '/api/docs/content-types' });

    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      items: [
        {
          displayName: 'Article',
          fieldCount: 0,
          id: 'articles',
          kind: 'collection',
          permissions: {
            create: ['admin', 'editor'],
            delete: ['admin'],
            list: ['admin', 'editor', 'viewer'],
            read: ['admin', 'editor', 'viewer'],
            update: ['admin'],
          },
          realtimeActions: {
            create: true,
            delete: false,
            update: true,
          },
          realtimeEnabled: true,
          slug: 'articles',
        },
      ],
      status: 'ok',
    });
  });
});
