import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildServer } from '../src/app.js';
import { bearerHeaders, loginAdmin } from './auth-test-utils.js';

describe('content fields routes', () => {
  it('creates, updates, and deletes fields', async () => {
    const databaseFile = join(await mkdtemp(join(tmpdir(), 'apiagex-fields-')), 'content-types.db');
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
        fields: [],
        kind: 'collection',
        slug: 'articles',
      },
    });

    const created = await app.inject({
      headers: bearerHeaders(token),
      method: 'POST',
      url: '/admin/content-types/articles/fields',
      payload: {
        key: 'title',
        label: 'Title',
        required: true,
        repeatable: false,
        sortOrder: 0,
        type: 'text',
      },
    });
    const relation = await app.inject({
      headers: bearerHeaders(token),
      method: 'POST',
      url: '/admin/content-types/articles/fields',
      payload: {
        key: 'author',
        label: 'Author',
        required: false,
        repeatable: false,
        settings: {
          targetContentTypeId: 'authors',
        },
        sortOrder: 1,
        type: 'relation',
      },
    });
    const updated = await app.inject({
      headers: bearerHeaders(token),
      method: 'PUT',
      url: '/admin/content-types/articles/fields/title',
      payload: {
        key: 'headline',
        label: 'Headline',
        required: true,
        repeatable: false,
        sortOrder: 1,
        type: 'text',
      },
    });
    const deleted = await app.inject({
      headers: bearerHeaders(token),
      method: 'DELETE',
      url: '/admin/content-types/articles/fields/headline',
    });

    await app.close();

    expect(created.statusCode).toBe(201);
    expect(created.json()).toMatchObject({
      contentTypeId: 'articles',
      id: 'articles:title',
      key: 'title',
    });
    expect(relation.statusCode).toBe(201);
    expect(relation.json()).toMatchObject({
      contentTypeId: 'articles',
      id: 'articles:author',
      key: 'author',
      settings: {
        targetContentTypeId: 'authors',
      },
      type: 'relation',
    });
    expect(updated.statusCode).toBe(200);
    expect(updated.json()).toMatchObject({
      contentTypeId: 'articles',
      id: 'articles:headline',
      key: 'headline',
    });
    expect(deleted.statusCode).toBe(204);
  });

  it('persists fields across restarts', async () => {
    const databaseFile = join(await mkdtemp(join(tmpdir(), 'apiagex-fields-')), 'content-types.db');

    {
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
          fields: [],
          kind: 'collection',
          slug: 'articles',
        },
      });

      await app.inject({
        headers: bearerHeaders(token),
        method: 'POST',
        url: '/admin/content-types/articles/fields',
        payload: {
          key: 'title',
          label: 'Title',
          required: true,
          repeatable: false,
          sortOrder: 0,
          type: 'text',
        },
      });

      await app.inject({
        headers: bearerHeaders(token),
        method: 'POST',
        url: '/admin/content-types/articles/fields',
        payload: {
          key: 'author',
          label: 'Author',
          required: false,
          repeatable: false,
          settings: {
            targetContentTypeId: 'authors',
          },
          sortOrder: 1,
          type: 'relation',
        },
      });

      await app.close();
    }

    {
      const app = await buildServer({ contentTypesDatabaseFile: databaseFile, logger: false });
      const token = await loginAdmin(app);
      const response = await app.inject({
        headers: bearerHeaders(token),
        method: 'GET',
        url: '/admin/content-types/articles/fields',
      });

      await app.close();

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        items: [
          {
            contentTypeId: 'articles',
            id: 'articles:title',
            key: 'title',
          },
          {
            contentTypeId: 'articles',
            id: 'articles:author',
            key: 'author',
            settings: {
              targetContentTypeId: 'authors',
            },
            type: 'relation',
          },
        ],
      });
    }
  });

});
