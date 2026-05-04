import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildServer } from '../src/app.js';
import { bearerHeaders, loginAdmin } from './auth-test-utils.js';

describe('content entries relation fields', () => {
  it('accepts relation fields as entry ids', async () => {
    const databaseFile = join(await mkdtemp(join(tmpdir(), 'apiagex-entries-')), 'content-types.db');
    const app = await buildServer({ contentTypesDatabaseFile: databaseFile, logger: false });
    const token = await loginAdmin(app);

    await app.inject({
      headers: bearerHeaders(token),
      method: 'POST',
      url: '/admin/content-types',
      payload: {
        displayName: 'Author',
        fields: [],
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
        ],
        kind: 'collection',
        slug: 'articles',
      },
    });

    const response = await app.inject({
      headers: bearerHeaders(token),
      method: 'POST',
      url: '/admin/content-types/articles/entries',
      payload: {
        data: {
          author: 'author-1',
          title: 'Hello',
        },
        status: 'draft',
      },
    });

    await app.close();

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      data: {
        author: 'author-1',
        title: 'Hello',
      },
    });
  });
});
