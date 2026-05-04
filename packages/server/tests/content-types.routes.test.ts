import { describe, expect, it } from 'vitest';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { buildServer } from '../src/app.js';
import { bearerHeaders, loginAdmin } from './auth-test-utils.js';

describe('content types routes', () => {
  it('lists empty content types', async () => {
    const databaseFile = join(await mkdtemp(join(tmpdir(), 'apiagex-server-')), 'content-types.db');
    const app = await buildServer({ contentTypesDatabaseFile: databaseFile, logger: false });
    const token = await loginAdmin(app);
    const response = await app.inject({
      headers: bearerHeaders(token),
      method: 'GET',
      url: '/admin/content-types',
    });

    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      items: [],
      status: 'ok',
    });
  });

  it('creates and updates a content type', async () => {
    const databaseFile = join(await mkdtemp(join(tmpdir(), 'apiagex-server-')), 'content-types.db');
    const app = await buildServer({ contentTypesDatabaseFile: databaseFile, logger: false });
    const token = await loginAdmin(app);
    const created = await app.inject({
      headers: bearerHeaders(token),
      method: 'POST',
      url: '/admin/content-types',
      payload: {
        displayName: 'Article',
        fields: [],
        kind: 'collection',
        realtimeEnabled: true,
        realtimeActions: {
          create: true,
          delete: false,
          update: false,
        },
        slug: 'articles',
      },
    });
    const updated = await app.inject({
      headers: bearerHeaders(token),
      method: 'PUT',
      url: '/admin/content-types/articles',
      payload: {
        displayName: 'Blog Article',
        fields: [],
        kind: 'collection',
        realtimeEnabled: true,
        realtimeActions: {
          create: true,
          delete: false,
          update: false,
        },
        slug: 'articles',
      },
    });

    await app.close();

    expect(created.statusCode).toBe(201);
    expect(created.json()).toMatchObject({
      displayName: 'Article',
      id: 'articles',
      realtimeActions: {
        create: true,
        delete: false,
        update: false,
      },
      realtimeEnabled: true,
      slug: 'articles',
    });
    expect(updated.statusCode).toBe(200);
    expect(updated.json()).toMatchObject({
      displayName: 'Blog Article',
      id: 'articles',
      realtimeActions: {
        create: true,
        delete: false,
        update: false,
      },
      realtimeEnabled: true,
    });
  });

  it('rejects non-boolean realtime action settings', async () => {
    const databaseFile = join(await mkdtemp(join(tmpdir(), 'apiagex-server-')), 'content-types.db');
    const app = await buildServer({ contentTypesDatabaseFile: databaseFile, logger: false });
    const token = await loginAdmin(app);
    const response = await app.inject({
      headers: bearerHeaders(token),
      method: 'POST',
      url: '/admin/content-types',
      payload: {
        displayName: 'Article',
        fields: [],
        kind: 'collection',
        realtimeActions: {
          create: 'yes',
        },
        realtimeEnabled: true,
        slug: 'articles',
      },
    });

    await app.close();

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      message: 'Invalid realtime settings',
    });
  });

  it('persists content types across restarts', async () => {
    const databaseFile = join(await mkdtemp(join(tmpdir(), 'apiagex-server-')), 'content-types.db');

    {
      const app = await buildServer({ contentTypesDatabaseFile: databaseFile, logger: false });
      const token = await loginAdmin(app);

      await app.inject({
        headers: bearerHeaders(token),
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

      await app.close();
    }

    {
      const app = await buildServer({ contentTypesDatabaseFile: databaseFile, logger: false });
      const token = await loginAdmin(app);
      const response = await app.inject({
        headers: bearerHeaders(token),
        method: 'GET',
        url: '/admin/content-types',
      });

      await app.close();

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        items: [
          {
            displayName: 'Article',
            id: 'articles',
            realtimeEnabled: true,
          },
        ],
      });
    }
  });

  it('duplicates content types and rewrites self relations', async () => {
    const databaseFile = join(await mkdtemp(join(tmpdir(), 'apiagex-server-')), 'content-types.db');
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
          {
            key: 'related',
            label: 'Related',
            repeatable: false,
            required: false,
            settings: { targetContentTypeId: 'articles' },
            sortOrder: 1,
            type: 'relation',
          },
        ],
        kind: 'collection',
        realtimeEnabled: true,
        slug: 'articles',
      },
    });

    const response = await app.inject({
      headers: bearerHeaders(token),
      method: 'POST',
      url: '/admin/content-types/articles/duplicate',
      payload: {
        displayName: 'Article Copy',
        slug: 'articles-copy',
      },
    });

    await app.close();

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      displayName: 'Article Copy',
      fields: [
        expect.objectContaining({ key: 'title', type: 'text' }),
        expect.objectContaining({
          key: 'related',
          settings: { targetContentTypeId: 'articles-copy' },
          type: 'relation',
        }),
      ],
      id: 'articles-copy',
      realtimeEnabled: true,
      slug: 'articles-copy',
    });
  });
});
