import { existsSync } from 'node:fs';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildServer } from '../src/app.js';
import { bearerHeaders, loginAdmin } from './auth-test-utils.js';

describe('release smoke', () => {
  it('boots, persists, exports, and restores a working site', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'apiagex-release-'));
    const sourceDatabaseFile = join(workspace, 'source.db');
    const sourceStorageDir = join(workspace, 'source-uploads');

    const sourceApp = await buildServer({
      contentTypesDatabaseFile: sourceDatabaseFile,
      logger: false,
      mediaStorageDir: sourceStorageDir,
    });
    const sourceToken = await loginAdmin(sourceApp);

    await createArticleSchema(sourceApp, sourceToken);

    const mediaResponse = await sourceApp.inject({
      headers: bearerHeaders(sourceToken),
      method: 'POST',
      url: '/admin/media-files',
      payload: {
        base64: Buffer.from('release-smoke-media').toString('base64'),
        filename: 'cover.png',
        mimeType: 'image/png',
      },
    });
    const mediaId = mediaResponse.json().id as string;

    const entryResponse = await sourceApp.inject({
      headers: bearerHeaders(sourceToken),
      method: 'POST',
      url: '/admin/content-types/articles/entries',
      payload: {
        data: {
          cover: mediaId,
          title: 'Release smoke entry',
        },
        status: 'published',
      },
    });

    const backupResponse = await sourceApp.inject({
      headers: bearerHeaders(sourceToken),
      method: 'GET',
      url: '/admin/backups/export',
    });
    const backupBundle = backupResponse.json() as {
      contentTypes?: readonly unknown[];
      entries?: readonly unknown[];
      mediaFiles?: readonly unknown[];
      schemaMigrations?: readonly unknown[];
      version?: number;
      webhooks?: unknown;
    };

    const sourcePublicResponse = await sourceApp.inject({
      method: 'GET',
      url: '/api/articles',
    });

    await sourceApp.close();

    const restartApp = await buildServer({
      contentTypesDatabaseFile: sourceDatabaseFile,
      logger: false,
      mediaStorageDir: sourceStorageDir,
    });
    const restartToken = await loginAdmin(restartApp);
    const restartEntriesResponse = await restartApp.inject({
      headers: bearerHeaders(restartToken),
      method: 'GET',
      url: '/admin/content-types/articles/entries',
    });
    const restartPublicResponse = await restartApp.inject({
      method: 'GET',
      url: '/api/articles',
    });

    await restartApp.close();

    const restoreDatabaseFile = join(workspace, 'restore.db');
    const restoreStorageDir = join(workspace, 'restore-uploads');
    const restoreApp = await buildServer({
      contentTypesDatabaseFile: restoreDatabaseFile,
      logger: false,
      mediaStorageDir: restoreStorageDir,
    });
    const restoreToken = await loginAdmin(restoreApp);
    const restoreResponse = await restoreApp.inject({
      headers: bearerHeaders(restoreToken),
      method: 'POST',
      url: '/admin/backups/restore',
      payload: backupBundle,
    });
    const restoreContentTypesResponse = await restoreApp.inject({
      headers: bearerHeaders(restoreToken),
      method: 'GET',
      url: '/admin/content-types',
    });
    const restoreEntriesResponse = await restoreApp.inject({
      headers: bearerHeaders(restoreToken),
      method: 'GET',
      url: '/admin/content-types/articles/entries',
    });
    const restoreMediaResponse = await restoreApp.inject({
      headers: bearerHeaders(restoreToken),
      method: 'GET',
      url: '/admin/media-files',
    });
    const restorePublicResponse = await restoreApp.inject({
      method: 'GET',
      url: '/api/articles',
    });

    await restoreApp.close();

    expect(backupResponse.statusCode).toBe(200);
    expect(backupBundle.version).toBe(1);
    expect(Array.isArray(backupBundle.contentTypes)).toBe(true);
    expect(Array.isArray(backupBundle.entries)).toBe(true);
    expect(Array.isArray(backupBundle.mediaFiles)).toBe(true);
    expect(Array.isArray(backupBundle.schemaMigrations)).toBe(true);
    expect(sourcePublicResponse.statusCode).toBe(200);
    expect(sourcePublicResponse.json()).toMatchObject({
      items: [
        {
          data: {
            cover: mediaId,
            title: 'Release smoke entry',
          },
        },
      ],
    });
    expect(entryResponse.statusCode).toBe(201);
    expect(restartEntriesResponse.statusCode).toBe(200);
    expect(restartEntriesResponse.json()).toMatchObject({
      items: [
        {
          contentTypeId: 'articles',
          data: {
            cover: mediaId,
            title: 'Release smoke entry',
          },
        },
      ],
    });
    expect(restartPublicResponse.statusCode).toBe(200);
    expect(restartPublicResponse.json()).toMatchObject({
      items: [
        {
          data: {
            cover: mediaId,
            title: 'Release smoke entry',
          },
        },
      ],
    });
    expect(restoreResponse.statusCode).toBe(200);
    expect(restoreContentTypesResponse.statusCode).toBe(200);
    expect(restoreEntriesResponse.statusCode).toBe(200);
    expect(restoreMediaResponse.statusCode).toBe(200);
    expect(restorePublicResponse.statusCode).toBe(200);
    expect(restoreContentTypesResponse.json()).toMatchObject({
      items: [
        {
          id: 'articles',
          slug: 'articles',
        },
      ],
    });
    expect(restoreEntriesResponse.json()).toMatchObject({
      items: [
        {
          contentTypeId: 'articles',
          data: {
            cover: mediaId,
            title: 'Release smoke entry',
          },
        },
      ],
    });
    const restoredMedia = restoreMediaResponse.json() as { items?: Array<{ storagePath?: string }> };
    const restoredStoragePath = restoredMedia.items?.[0]?.storagePath;
    expect(typeof restoredStoragePath).toBe('string');
    expect(restoredStoragePath ? existsSync(restoredStoragePath) : false).toBe(true);
    expect(restorePublicResponse.json()).toMatchObject({
      items: [
        {
          data: {
            cover: mediaId,
            title: 'Release smoke entry',
          },
        },
      ],
    });
  });
});

async function createArticleSchema(app: Awaited<ReturnType<typeof buildServer>>, token: string): Promise<void> {
  const response = await app.inject({
    headers: bearerHeaders(token),
    method: 'POST',
    url: '/admin/content-types',
    payload: {
      displayName: 'Article',
      fields: [
        {
          key: 'cover',
          label: 'Cover',
          repeatable: false,
          required: true,
          sortOrder: 0,
          type: 'media',
        },
        {
          key: 'title',
          label: 'Title',
          repeatable: false,
          required: true,
          sortOrder: 1,
          type: 'text',
        },
      ],
      kind: 'collection',
      slug: 'articles',
    },
  });

  expect(response.statusCode).toBe(201);
}
