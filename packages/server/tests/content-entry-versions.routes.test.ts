import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildServer } from '../src/app.js';
import { bearerHeaders, loginAdmin } from './auth-test-utils.js';

describe('content entry versions routes', () => {
  it('lists versions and restores an older snapshot', async () => {
    const databaseFile = join(await mkdtemp(join(tmpdir(), 'apiagex-versions-')), 'content-types.db');
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
          title: 'Original',
        },
        status: 'draft',
      },
    });

    await app.inject({
      headers: bearerHeaders(token),
      method: 'PUT',
      url: `/admin/content-types/articles/entries/${created.json().id}`,
      payload: {
        data: {
          title: 'Updated',
        },
        status: 'published',
      },
    });

    const versionsResponse = await app.inject({
      headers: bearerHeaders(token),
      method: 'GET',
      url: `/admin/content-types/articles/entries/${created.json().id}/versions`,
    });
    const versions = versionsResponse.json() as {
      items: Array<{ data: { title: string }; id: string }>;
    };
    const originalVersion = versions.items.find((item) => item.data.title === 'Original');

    const restoreResponse = await app.inject({
      headers: bearerHeaders(token),
      method: 'POST',
      url: `/admin/content-types/articles/entries/${created.json().id}/versions/${originalVersion?.id}/restore`,
    });
    const restoredList = await app.inject({
      headers: bearerHeaders(token),
      method: 'GET',
      url: '/admin/content-types/articles/entries',
    });

    await app.close();

    expect(versionsResponse.statusCode).toBe(200);
    expect(versions.items).toHaveLength(2);
    expect(originalVersion).toBeTruthy();
    expect(restoreResponse.statusCode).toBe(200);
    expect(restoredList.statusCode).toBe(200);
    expect(restoredList.json()).toMatchObject({
      items: [
        expect.objectContaining({
          data: { title: 'Original' },
          status: 'draft',
        }),
      ],
    });
  });
});
