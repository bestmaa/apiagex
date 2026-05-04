import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildServer } from '../src/app.js';
import { bearerHeaders, loginAdmin } from './auth-test-utils.js';

describe('backup routes', () => {
  it('exports a backup bundle and restores it into a fresh server', async () => {
    const sourceDatabaseFile = join(await mkdtemp(join(tmpdir(), 'apiagex-backup-source-')), 'content.db');
    const sourceApp = await buildServer({ contentTypesDatabaseFile: sourceDatabaseFile, logger: false });
    const sourceToken = await loginAdmin(sourceApp);

    await sourceApp.inject({
      headers: bearerHeaders(sourceToken),
      method: 'POST',
      url: '/admin/content-types',
      payload: {
        displayName: 'Article',
        fields: [],
        kind: 'collection',
        realtimeEnabled: true,
        slug: 'articles',
      },
    });

    await sourceApp.inject({
      headers: bearerHeaders(sourceToken),
      method: 'POST',
      url: '/admin/content-types/articles/entries',
      payload: {
        data: {},
        status: 'draft',
      },
    });

    const exportResponse = await sourceApp.inject({
      headers: bearerHeaders(sourceToken),
      method: 'GET',
      url: '/admin/backups/export',
    });
    const bundle = exportResponse.json() as {
      contentTypes?: readonly unknown[];
      entries?: readonly unknown[];
      schemaMigrations?: readonly unknown[];
      version?: number;
    };

    await sourceApp.close();

    const restoreDatabaseFile = join(await mkdtemp(join(tmpdir(), 'apiagex-backup-restore-')), 'content.db');
    const restoreApp = await buildServer({ contentTypesDatabaseFile: restoreDatabaseFile, logger: false });
    const restoreToken = await loginAdmin(restoreApp);
    const restoreResponse = await restoreApp.inject({
      headers: bearerHeaders(restoreToken),
      method: 'POST',
      url: '/admin/backups/restore',
      payload: bundle,
    });
    const contentTypesResponse = await restoreApp.inject({
      headers: bearerHeaders(restoreToken),
      method: 'GET',
      url: '/admin/content-types',
    });
    const entriesResponse = await restoreApp.inject({
      headers: bearerHeaders(restoreToken),
      method: 'GET',
      url: '/admin/content-types/articles/entries',
    });
    const migrationsResponse = await restoreApp.inject({
      headers: bearerHeaders(restoreToken),
      method: 'GET',
      url: '/admin/migrations',
    });

    await restoreApp.close();

    expect(exportResponse.statusCode).toBe(200);
    expect(exportResponse.headers['content-disposition']).toContain('apiagex-backup.json');
    expect(bundle.version).toBe(1);
    expect(Array.isArray(bundle.contentTypes)).toBe(true);
    expect(Array.isArray(bundle.entries)).toBe(true);
    expect(Array.isArray(bundle.schemaMigrations)).toBe(true);
    expect(restoreResponse.statusCode).toBe(200);
    expect(contentTypesResponse.statusCode).toBe(200);
    expect(contentTypesResponse.json()).toMatchObject({
      items: [
        {
          id: 'articles',
          slug: 'articles',
        },
      ],
    });
    expect(entriesResponse.statusCode).toBe(200);
    expect(entriesResponse.json()).toMatchObject({
      items: [
        {
          contentTypeId: 'articles',
          data: {},
        },
      ],
    });
    expect(migrationsResponse.statusCode).toBe(200);
    expect(migrationsResponse.json()).toMatchObject({
      items: expect.any(Array),
    });
  });
});
