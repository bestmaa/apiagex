import { createServer } from 'node:http';
import { afterEach, describe, expect, it } from 'vitest';

import { buildAdminApp } from '../src/app.js';

let backendServer: ReturnType<typeof createServer> | null = null;

afterEach(async () => {
  if (!backendServer) {
    return;
  }

  await new Promise<void>((resolve) => backendServer!.close(() => resolve()));
  backendServer = null;
});

describe('buildAdminApp', () => {
  it('serves the ui shell and proxies content types requests', async () => {
    backendServer = createServer((request, response) => {
      if (request.url === '/auth/login') {
        response.setHeader('content-type', 'application/json');
        response.end(JSON.stringify({
          status: 'ok',
          token: 'admin-token',
          user: { email: 'admin@example.com', role: 'admin' },
        }));
        return;
      }

      if (request.url === '/admin/content-types') {
        response.setHeader('content-type', 'application/json');
        response.end(JSON.stringify({
          items: [
            {
              id: 'articles',
              permissions: {
                create: ['admin', 'editor'],
                delete: ['admin'],
                list: ['admin', 'editor', 'viewer'],
                read: ['admin', 'editor', 'viewer'],
                update: ['admin'],
              },
              slug: 'articles',
            },
          ],
        }));
        return;
      }

      if (request.url === '/admin/roles') {
        response.setHeader('content-type', 'application/json');
        response.end(JSON.stringify({
          items: [
            {
              description: 'Content editors',
              id: 'editor-lite',
              name: 'Editor Lite',
              permissions: { 'content-types:articles': { create: true, delete: false, list: true, read: true, update: true } },
            },
          ],
          status: 'ok',
        }));
        return;
      }

      if (request.url?.startsWith('/realtime/stream')) {
        response.setHeader('content-type', 'text/event-stream');
        response.end('event: ready\ndata: {"status":"ok"}\n\n');
        return;
      }

      if (request.url === '/admin/content-types/articles/fields') {
        response.setHeader('content-type', 'application/json');
        response.end(JSON.stringify({ items: [{ contentTypeId: 'articles', id: 'articles:title', key: 'title' }] }));
        return;
      }

      if (request.url === '/admin/content-types/articles/entries') {
        response.setHeader('content-type', 'application/json');
        response.end(JSON.stringify({
          counts: { pendingApproval: 1, total: 1 },
          page: 1,
          pages: 1,
          pageSize: 10,
          items: [{ contentTypeId: 'articles', id: 'entry-1', data: { title: 'Hello' }, status: 'draft' }],
          total: 1,
        }));
        return;
      }

      if (request.url === '/admin/content-types/articles/entries/entry-1/versions') {
        response.setHeader('content-type', 'application/json');
        response.end(JSON.stringify({ items: [{ id: 'version-1', createdAt: '2026-04-30T00:00:00.000Z', data: { title: 'Hello' }, entryId: 'entry-1', publishAt: null, status: 'draft' }] }));
        return;
      }

      if (request.url === '/admin/content-types/articles/entries/entry-1/preview') {
        response.setHeader('content-type', 'application/json');
        response.end(JSON.stringify({ previewUrl: 'http://127.0.0.1:4000/api/articles/entry-1?preview=token', status: 'ok', token: 'token' }));
        return;
      }

      if (request.url === '/admin/content-types/articles/duplicate') {
        response.setHeader('content-type', 'application/json');
        response.end(JSON.stringify({ id: 'articles-copy', displayName: 'Article Copy', slug: 'articles-copy' }));
        return;
      }

      if (request.url === '/admin/audit-logs') {
        response.setHeader('content-type', 'application/json');
        response.end(JSON.stringify({ items: [{ action: 'create', actorEmail: 'admin@example.com', scope: 'content-types', subjectId: 'articles' }] }));
        return;
      }

      if (request.url === '/admin/webhooks') {
        response.setHeader('content-type', 'application/json');
        response.end(JSON.stringify({
          items: [{
            enabled: true,
            events: ['content-types.create'],
            filters: { actions: ['create'], contentTypeIds: ['articles'] },
            id: 'webhook-1',
            name: 'Content types',
            targetUrl: 'https://example.com/hook',
          }],
        }));
        return;
      }

      if (request.url === '/admin/webhooks/webhook-1/deliveries') {
        response.setHeader('content-type', 'application/json');
        response.end(JSON.stringify({ items: [{ eventName: 'content-types.create', statusCode: 200 }] }));
        return;
      }

      if (request.url === '/admin/search?q=art') {
        response.setHeader('content-type', 'application/json');
        response.end(JSON.stringify({
          items: [
            { kind: 'content-type', id: 'articles', title: 'Article', subtitle: 'articles', detail: 'collection - 1 field(s)' },
          ],
          query: 'art',
          status: 'ok',
        }));
        return;
      }

      if (request.url === '/health/detail') {
        response.setHeader('content-type', 'application/json');
        response.end(JSON.stringify({
          cache: { publicResponses: 'enabled', schema: 'enabled' },
          docs: '/docs',
          requestIdHeader: 'x-request-id',
          scheduler: { status: 'running' },
          service: 'apiagex',
          status: 'ok',
          storage: { driver: 'local', uploadsPath: '/tmp/uploads' },
        }));
        return;
      }

      if (request.url === '/docs/') {
        response.setHeader('content-type', 'text/html');
        response.end('<!doctype html><title>Docs</title>');
        return;
      }

      response.statusCode = 404;
      response.end('not found');
    });

    await new Promise<void>((resolve) => backendServer!.listen(0, '127.0.0.1', () => resolve()));
    const backendPort = (backendServer.address() as { port: number }).port;
    const app = await buildAdminApp({
      backendUrl: `http://127.0.0.1:${backendPort}`,
      host: '127.0.0.1',
      port: 0,
    });
    const appPort = (app.server.address() as { port: number }).port;

    const shellResponse = await fetch(`http://127.0.0.1:${appPort}/`);
    const missingAssetResponse = await fetch(
      `http://127.0.0.1:${appPort}/.well-known/appspecific/com.chrome.devtools.json`,
    );
    const healthAfterMissingAssetResponse = await fetch(`http://127.0.0.1:${appPort}/health`);
    const loginResponse = await fetch(`http://127.0.0.1:${appPort}/auth/login`, {
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'secret123',
      }),
      headers: {
        'content-type': 'application/json',
      },
      method: 'POST',
    });
    const apiResponse = await fetch(`http://127.0.0.1:${appPort}/api/content-types`);
    const rolesResponse = await fetch(`http://127.0.0.1:${appPort}/api/roles`);
    const fieldResponse = await fetch(`http://127.0.0.1:${appPort}/api/content-types/articles/fields`);
    const entryResponse = await fetch(`http://127.0.0.1:${appPort}/api/content-types/articles/entries`);
    const versionsResponse = await fetch(`http://127.0.0.1:${appPort}/api/content-types/articles/entries/entry-1/versions`);
    const previewResponse = await fetch(`http://127.0.0.1:${appPort}/api/content-types/articles/entries/entry-1/preview`, {
      method: 'POST',
    });
    const duplicateResponse = await fetch(`http://127.0.0.1:${appPort}/api/content-types/articles/duplicate`, {
      body: JSON.stringify({ displayName: 'Article Copy', slug: 'articles-copy' }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });
    const auditResponse = await fetch(`http://127.0.0.1:${appPort}/api/audit-logs`);
    const webhookResponse = await fetch(`http://127.0.0.1:${appPort}/api/webhooks`);
    const webhookDeliveryResponse = await fetch(`http://127.0.0.1:${appPort}/api/webhooks/webhook-1/deliveries`);
    const searchResponse = await fetch(`http://127.0.0.1:${appPort}/api/search?q=art`);
    const realtimeResponse = await fetch(`http://127.0.0.1:${appPort}/realtime/stream?contentTypes=articles`);
    const docsRedirectResponse = await fetch(`http://127.0.0.1:${appPort}/docs`, { redirect: 'manual' });
    const docsResponse = await fetch(`http://127.0.0.1:${appPort}/docs/`);

    expect(shellResponse.status).toBe(200);
    const shellHtml = await shellResponse.text();
    expect(shellHtml).toContain('Apiagex Admin');
    expect(shellHtml).toContain('href="/docs/"');
    expect(shellHtml).toContain('data-route-link="roles"');
    expect(shellHtml).toContain('roles-shell');
    expect(shellHtml).toContain('rolesTitle');
    expect(shellHtml).toContain('rolesPermissionsMatrix');
    expect(shellHtml).toContain('rolesMatrixHint');
    expect(shellHtml).toContain('role-id');
    expect(shellHtml).toContain('role-name');
    expect(shellHtml).toContain('role-description');
    expect(shellHtml).toContain('permissions-matrix');
    expect(shellHtml).toContain('entry-versions-compare');
    expect(shellHtml).toContain('entry-approval');
    expect(shellHtml).toContain('entryStatusPendingApproval');
    expect(shellHtml).toContain('data-entry-status-filter="pendingApproval"');
    expect(shellHtml).toContain('entry-summary');
    expect(shellHtml).toContain('entry-bulk-select-page');
    expect(shellHtml).toContain('entry-bulk-delete');
    expect(shellHtml).toContain('entry-bulk-count');
    expect(shellHtml).toContain('entry-search');
    expect(shellHtml).toContain('entry-page-info');
    expect(shellHtml).toContain('ops-shell');
    expect(shellHtml).toContain('opsTitle');
    expect(shellHtml).toContain('content-form-reset');
    ['#/realtime', 'realtime-shell', 'realtimePageTitle', 'realtimePageHint', 'realtimeStreamExampleLabel', 'realtimeContentTypes', 'realtimePreview', 'realtime-active-stream', 'realtime-connection-status', 'realtime-types', 'realtime-events', 'realtimeSection', 'realtimeMaster', 'realtimeCreate', 'realtimeUpdate', 'realtimeDelete', 'realtime-actions', 'realtime-create', 'realtime-update', 'realtime-delete'].forEach((value) => {
      expect(shellHtml).toContain(value);
    });
    [
      'webhooks-shell',
      'webhooksTitle',
      'webhooksFilters',
      'webhooksFilterHint',
      'webhooksFilterContentTypes',
      'webhooksFilterActions',
      'webhooks-filter-content-types',
      'webhooks-filter-actions',
    ].forEach((value) => {
      expect(shellHtml).toContain(value);
    });
    expect(missingAssetResponse.status).toBe(404);
    expect(healthAfterMissingAssetResponse.status).toBe(200);
    expect(loginResponse.status).toBe(200);
    expect(await loginResponse.json()).toEqual({
      status: 'ok',
      token: 'admin-token',
      user: { email: 'admin@example.com', role: 'admin' },
    });
    expect(apiResponse.status).toBe(200);
    expect(await apiResponse.json()).toEqual({
      items: [
        {
          id: 'articles',
          permissions: {
            create: ['admin', 'editor'],
            delete: ['admin'],
            list: ['admin', 'editor', 'viewer'],
            read: ['admin', 'editor', 'viewer'],
            update: ['admin'],
          },
          slug: 'articles',
        },
      ],
    });
    expect(rolesResponse.status).toBe(200);
    expect(await rolesResponse.json()).toEqual({
      items: [
        {
          description: 'Content editors',
          id: 'editor-lite',
          name: 'Editor Lite',
          permissions: { 'content-types:articles': { create: true, delete: false, list: true, read: true, update: true } },
        },
      ],
      status: 'ok',
    });
    expect(fieldResponse.status).toBe(200);
    expect(await fieldResponse.json()).toEqual({
      items: [{ contentTypeId: 'articles', id: 'articles:title', key: 'title' }],
    });
    expect(entryResponse.status).toBe(200);
    expect(await entryResponse.json()).toEqual({
      counts: { pendingApproval: 1, total: 1 },
      page: 1,
      pages: 1,
      pageSize: 10,
      items: [{ contentTypeId: 'articles', data: { title: 'Hello' }, id: 'entry-1', status: 'draft' }],
      total: 1,
    });
    expect(versionsResponse.status).toBe(200);
    expect(await versionsResponse.json()).toEqual({
      items: [{ createdAt: '2026-04-30T00:00:00.000Z', data: { title: 'Hello' }, entryId: 'entry-1', id: 'version-1', publishAt: null, status: 'draft' }],
    });
    expect(previewResponse.status).toBe(200);
    expect(await previewResponse.json()).toEqual({
      previewUrl: 'http://127.0.0.1:4000/api/articles/entry-1?preview=token',
      status: 'ok',
      token: 'token',
    });
    expect(duplicateResponse.status).toBe(200);
    expect(await duplicateResponse.json()).toEqual({
      displayName: 'Article Copy',
      id: 'articles-copy',
      slug: 'articles-copy',
    });
    expect(auditResponse.status).toBe(200);
    expect(await auditResponse.json()).toEqual({
      items: [{ action: 'create', actorEmail: 'admin@example.com', scope: 'content-types', subjectId: 'articles' }],
    });
    expect(webhookResponse.status).toBe(200);
    expect(await webhookResponse.json()).toEqual({
      items: [{
        enabled: true,
        events: ['content-types.create'],
        filters: { actions: ['create'], contentTypeIds: ['articles'] },
        id: 'webhook-1',
        name: 'Content types',
        targetUrl: 'https://example.com/hook',
      }],
    });
    expect(webhookDeliveryResponse.status).toBe(200);
    expect(await webhookDeliveryResponse.json()).toEqual({
      items: [{ eventName: 'content-types.create', statusCode: 200 }],
    });
    expect(searchResponse.status).toBe(200);
    expect(await searchResponse.json()).toEqual({
      items: [
        { kind: 'content-type', id: 'articles', title: 'Article', subtitle: 'articles', detail: 'collection - 1 field(s)' },
      ],
      query: 'art',
      status: 'ok',
    });
    expect(realtimeResponse.status).toBe(200);
    expect(await realtimeResponse.text()).toContain('event: ready');
    expect(docsRedirectResponse.status).toBe(302);
    expect(docsRedirectResponse.headers.get('location')).toBe('/docs/');
    expect(docsResponse.status).toBe(200);
    expect(await docsResponse.text()).toContain('<title>Docs</title>');
    const healthDetailResponse = await fetch(`http://127.0.0.1:${appPort}/api/health/detail`);
    expect(healthDetailResponse.status).toBe(200);
    expect(await healthDetailResponse.json()).toEqual({
      cache: { publicResponses: 'enabled', schema: 'enabled' },
      docs: '/docs',
      requestIdHeader: 'x-request-id',
      scheduler: { status: 'running' },
      service: 'apiagex',
      status: 'ok',
      storage: { driver: 'local', uploadsPath: '/tmp/uploads' },
    });

    await app.close();
  });
});
