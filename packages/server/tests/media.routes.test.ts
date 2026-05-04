import { mkdtemp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildServer } from '../src/app.js';
import { bearerHeaders, loginAdmin } from './auth-test-utils.js';

describe('media routes', () => {
  it('uploads and lists media files', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'apiagex-media-'));
    const databaseFile = join(workspace, 'content-types.db');
    const storageDir = join(workspace, 'uploads');
    const app = await buildServer({
      contentTypesDatabaseFile: databaseFile,
      logger: false,
      mediaStorageDir: storageDir,
    });
    const token = await loginAdmin(app);

    const upload = await app.inject({
      headers: bearerHeaders(token),
      method: 'POST',
      url: '/admin/media-files',
      payload: {
        base64: Buffer.from('media-file-contents').toString('base64'),
        filename: 'cover.png',
        mimeType: 'image/png',
      },
    });
    const listing = await app.inject({
      headers: bearerHeaders(token),
      method: 'GET',
      url: '/admin/media-files',
    });

    await app.close();

    expect(upload.statusCode).toBe(201);
    expect(upload.json()).toMatchObject({
      filename: 'cover.png',
      mimeType: 'image/png',
    });
    expect(existsSync(upload.json().storagePath)).toBe(true);
    expect(listing.statusCode).toBe(200);
    expect(listing.json()).toMatchObject({
      items: [
        {
          filename: 'cover.png',
          mimeType: 'image/png',
        },
      ],
    });
  });

  it('rejects unknown media ids in entry payloads', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'apiagex-media-'));
    const databaseFile = join(workspace, 'content-types.db');
    const storageDir = join(workspace, 'uploads');
    const app = await buildServer({
      contentTypesDatabaseFile: databaseFile,
      logger: false,
      mediaStorageDir: storageDir,
    });
    const token = await loginAdmin(app);

    await app.inject({
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
        ],
        kind: 'collection',
        slug: 'articles',
      },
    });

    const invalid = await app.inject({
      headers: bearerHeaders(token),
      method: 'POST',
      url: '/admin/content-types/articles/entries',
      payload: {
        data: {
          cover: 'missing-media-id',
        },
        status: 'draft',
      },
    });

    const upload = await app.inject({
      headers: bearerHeaders(token),
      method: 'POST',
      url: '/admin/media-files',
      payload: {
        base64: Buffer.from('media-file-contents').toString('base64'),
        filename: 'cover.png',
        mimeType: 'image/png',
      },
    });
    const mediaId = upload.json().id;
    const valid = await app.inject({
      headers: bearerHeaders(token),
      method: 'POST',
      url: '/admin/content-types/articles/entries',
      payload: {
        data: {
          cover: mediaId,
        },
        status: 'published',
      },
    });

    await app.close();

    expect(invalid.statusCode).toBe(400);
    expect(invalid.json()).toMatchObject({
      message: 'Invalid media field value: Cover',
    });
    expect(valid.statusCode).toBe(201);
    expect(valid.json()).toMatchObject({
      data: {
        cover: mediaId,
      },
    });
  });
});
