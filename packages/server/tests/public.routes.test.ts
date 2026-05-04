import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildServer } from '../src/app.js';
import { bearerHeaders, loginAdmin } from './auth-test-utils.js';

describe('public routes', () => {
  it('serves published collection entries', async () => {
    const databaseFile = join(await mkdtemp(join(tmpdir(), 'apiagex-public-')), 'content-types.db');
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
        data: {
          title: 'Draft article',
        },
        status: 'draft',
      },
    });

    await app.inject({
      headers: bearerHeaders(token),
      method: 'POST',
      url: '/admin/content-types/articles/entries',
      payload: {
        data: {
          title: 'Published article',
        },
        status: 'published',
      },
    });

    const response = await app.inject({ method: 'GET', url: '/api/articles' });

    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      items: [
        {
          data: { title: 'Published article' },
        },
      ],
      status: 'ok',
    });
    expect(response.json().items).toHaveLength(1);
  });

  it('serves the published item for single content types', async () => {
    const databaseFile = join(await mkdtemp(join(tmpdir(), 'apiagex-public-')), 'content-types.db');
    const app = await buildServer({ contentTypesDatabaseFile: databaseFile, logger: false });
    const token = await loginAdmin(app);

    await app.inject({
      headers: bearerHeaders(token),
      method: 'POST',
      url: '/admin/content-types',
      payload: {
        displayName: 'Homepage',
        fields: [
          {
            key: 'headline',
            label: 'Headline',
            repeatable: false,
            required: true,
            sortOrder: 0,
            type: 'text',
          },
        ],
        kind: 'single',
        slug: 'homepage',
      },
    });

    const created = await app.inject({
      headers: bearerHeaders(token),
      method: 'POST',
      url: '/admin/content-types/homepage/entries',
      payload: {
        data: {
          headline: 'Welcome',
        },
        status: 'published',
      },
    });

    const response = await app.inject({ method: 'GET', url: '/api/homepage' });
    const entryResponse = await app.inject({
      method: 'GET',
      url: `/api/homepage/${created.json().id}`,
    });

    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      item: {
        data: { headline: 'Welcome' },
      },
      status: 'ok',
    });
    expect(entryResponse.statusCode).toBe(200);
    expect(entryResponse.json()).toMatchObject({
      item: {
        data: { headline: 'Welcome' },
      },
      status: 'ok',
    });
  });
});
