import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildServer } from '../src/app.js';
import { bearerHeaders, loginAdmin } from './auth-test-utils.js';

describe('search routes', () => {
  it('searches content types, entries, and media', async () => {
    const databaseFile = join(await mkdtemp(join(tmpdir(), 'apiagex-search-')), 'content-types.db');
    const app = await buildServer({ contentTypesDatabaseFile: databaseFile, logger: false });
    const token = await loginAdmin(app);

    await app.inject({
      headers: bearerHeaders(token),
      method: 'POST',
      url: '/admin/content-types',
      payload: {
        displayName: 'Article',
        fields: [
          {
            key: 'title',
            label: 'Title',
            repeatable: false,
            required: true,
            sortOrder: 0,
            type: 'text',
          },
        ],
        kind: 'collection',
        slug: 'articles',
      },
    });

    await app.inject({
      headers: bearerHeaders(token),
      method: 'POST',
      url: '/admin/content-types/articles/entries',
      payload: {
        data: { title: 'Search me' },
        status: 'published',
      },
    });

    await app.inject({
      headers: bearerHeaders(token),
      method: 'POST',
      url: '/admin/media-files',
      payload: {
        base64: Buffer.from('media').toString('base64'),
        filename: 'art-guide.png',
        mimeType: 'image/png',
      },
    });

    const response = await app.inject({
      headers: bearerHeaders(token),
      method: 'GET',
      url: '/admin/search?q=art',
    });

    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      query: 'art',
      status: 'ok',
    });
    expect(response.json().items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'content-type', id: 'articles' }),
        expect.objectContaining({ kind: 'entry', entryId: expect.any(String) }),
        expect.objectContaining({ kind: 'media', id: expect.any(String) }),
      ]),
    );
  });
});
