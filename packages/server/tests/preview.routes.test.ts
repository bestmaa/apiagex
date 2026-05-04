import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildServer } from '../src/app.js';
import { bearerHeaders, loginAdmin } from './auth-test-utils.js';

describe('preview routes', () => {
  it('returns draft entries only with a signed preview token', async () => {
    const databaseFile = join(await mkdtemp(join(tmpdir(), 'apiagex-preview-')), 'content-types.db');
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

    const created = await app.inject({
      headers: bearerHeaders(token),
      method: 'POST',
      url: '/admin/content-types/articles/entries',
      payload: {
        data: {
          title: 'Draft article',
        },
        status: 'draft',
      },
    });

    const previewResponse = await app.inject({
      headers: bearerHeaders(token),
      method: 'POST',
      url: `/admin/content-types/articles/entries/${created.json().id}/preview`,
    });
    const previewUrl = new URL(previewResponse.json().previewUrl);
    const publicResponse = await app.inject({
      method: 'GET',
      url: `${previewUrl.pathname}${previewUrl.search}`,
    });
    const publicListResponse = await app.inject({
      method: 'GET',
      url: '/api/articles',
    });

    await app.close();

    expect(previewResponse.statusCode).toBe(200);
    expect(previewUrl.pathname).toBe(`/api/articles/${created.json().id}`);
    expect(publicResponse.statusCode).toBe(200);
    expect(publicResponse.json()).toMatchObject({
      item: {
        data: {
          title: 'Draft article',
        },
      },
      status: 'ok',
    });
    expect(publicListResponse.statusCode).toBe(200);
    expect(publicListResponse.json()).toMatchObject({
      items: [],
      status: 'ok',
    });
  });
});
