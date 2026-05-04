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

describe('backup and migrations panels', () => {
  it('proxies backup and migration routes and wires the shell', async () => {
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

      if (request.url === '/admin/backups/export') {
        response.setHeader('content-type', 'application/json');
        response.setHeader('content-disposition', 'attachment; filename="apiagex-backup.json"');
        response.end(JSON.stringify({
          contentTypes: [{ id: 'articles', slug: 'articles' }],
          entries: [],
          exportedAt: '2026-04-30T00:00:00.000Z',
          mediaFiles: [],
          schemaMigrations: [{ appliedAt: '2026-04-30T00:00:00.000Z', name: '0001', scope: 'content-types' }],
          version: 1,
          webhooks: { deliveries: [], items: [] },
        }));
        return;
      }

      if (request.url === '/admin/backups/restore') {
        response.setHeader('content-type', 'application/json');
        response.end(JSON.stringify({
          status: 'ok',
          summary: { auditLogs: 0, contentTypes: 1, entries: 0, mediaFiles: 0, schemaMigrations: 1, webhooks: 0 },
        }));
        return;
      }

      if (request.url === '/admin/migrations') {
        response.setHeader('content-type', 'application/json');
        response.end(JSON.stringify({
          items: [{ appliedAt: '2026-04-30T00:00:00.000Z', name: '0001', scope: 'content-types' }],
          status: 'ok',
        }));
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
    const appScriptResponse = await fetch(`http://127.0.0.1:${appPort}/app.js`);
    const backupExportResponse = await fetch(`http://127.0.0.1:${appPort}/api/backups/export`);
    const backupRestoreResponse = await fetch(`http://127.0.0.1:${appPort}/api/backups/restore`, {
      body: JSON.stringify({ version: 1 }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });
    const migrationsResponse = await fetch(`http://127.0.0.1:${appPort}/api/migrations`);

    await app.close();

    expect(shellResponse.status).toBe(200);
    expect(await shellResponse.text()).toContain('Apiagex Admin');
    expect(backupExportResponse.status).toBe(200);
    expect(await backupExportResponse.json()).toMatchObject({
      contentTypes: [{ id: 'articles', slug: 'articles' }],
      version: 1,
    });
    expect(backupRestoreResponse.status).toBe(200);
    expect(await backupRestoreResponse.json()).toEqual({
      status: 'ok',
      summary: { auditLogs: 0, contentTypes: 1, entries: 0, mediaFiles: 0, schemaMigrations: 1, webhooks: 0 },
    });
    expect(migrationsResponse.status).toBe(200);
    expect(await migrationsResponse.json()).toEqual({
      items: [{ appliedAt: '2026-04-30T00:00:00.000Z', name: '0001', scope: 'content-types' }],
      status: 'ok',
    });
    expect(appScriptResponse.status).toBe(200);
    const appScript = await appScriptResponse.text();
    expect(appScript).toContain('createBackupPanel');
    expect(appScript).toContain('createMigrationsPanel');
  });
});
