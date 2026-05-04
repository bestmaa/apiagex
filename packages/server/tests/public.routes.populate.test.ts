import { mkdtemp } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { tmpdir } from 'node:os';

import { describe, expect, it } from 'vitest';

import { buildServer } from '../src/app.js';
import { bearerHeaders, loginAdmin } from './auth-test-utils.js';

describe('public routes populate', () => {
  it('populates relation and media fields on demand', async () => {
    const databaseFile = join(await mkdtemp(join(tmpdir(), 'apiagex-populate-')), 'content-types.db');
    const app = await buildServer({ contentTypesDatabaseFile: databaseFile, logger: false });
    const token = await loginAdmin(app);

    await app.inject({
      headers: bearerHeaders(token),
      method: 'POST',
      url: '/admin/content-types',
      payload: {
        displayName: 'Author',
        fields: [
          {
            key: 'name',
            label: 'Name',
            repeatable: false,
            required: true,
            sortOrder: 0,
            type: 'text',
          },
        ],
        kind: 'collection',
        slug: 'authors',
      },
    });

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
          {
            key: 'author',
            label: 'Author',
            repeatable: false,
            required: false,
            settings: {
              targetContentTypeId: 'authors',
            },
            sortOrder: 1,
            type: 'relation',
          },
          {
            key: 'cover',
            label: 'Cover',
            repeatable: false,
            required: false,
            sortOrder: 2,
            type: 'media',
          },
        ],
        kind: 'collection',
        slug: 'articles',
      },
    });

    const mediaResponse = await app.inject({
      headers: bearerHeaders(token),
      method: 'POST',
      url: '/admin/media-files',
      payload: {
        base64: Buffer.from('cover').toString('base64'),
        filename: 'cover.txt',
        mimeType: 'text/plain',
      },
    });
    const media = mediaResponse.json();

    const authorResponse = await app.inject({
      headers: bearerHeaders(token),
      method: 'POST',
      url: '/admin/content-types/authors/entries',
      payload: {
        data: {
          name: 'Ada',
        },
        status: 'published',
      },
    });
    const authorId = authorResponse.json().id;

    await app.inject({
      headers: bearerHeaders(token),
      method: 'POST',
      url: '/admin/content-types/articles/entries',
      payload: {
        data: {
          author: authorId,
          cover: media.id,
          title: 'Hello',
        },
        status: 'published',
      },
    });

    const plainResponse = await app.inject({ method: 'GET', url: '/api/articles' });
    const populatedResponse = await app.inject({ method: 'GET', url: '/api/articles?populate=relations,media' });

    await app.close();

    expect(plainResponse.statusCode).toBe(200);
    expect(plainResponse.json()).toMatchObject({
      items: [
        {
          data: {
            author: authorId,
            cover: media.id,
            title: 'Hello',
          },
        },
      ],
    });
    expect(populatedResponse.statusCode).toBe(200);
    expect(populatedResponse.json()).toMatchObject({
      items: [
        {
          data: {
            author: {
              data: {
                name: 'Ada',
              },
              id: authorId,
            },
            cover: {
              filename: 'cover.txt',
              id: media.id,
              mimeType: 'text/plain',
              size: 5,
              url: `/uploads/${basename(media.storagePath)}`,
            },
            title: 'Hello',
          },
        },
      ],
    });
  });
});
