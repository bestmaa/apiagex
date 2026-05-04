import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildServer } from '../src/app.js';
import { bearerHeaders, loginAdmin } from './auth-test-utils.js';

describe('content entries routes', () => {
  it('creates, updates, and deletes entries', async () => {
    const databaseFile = join(await mkdtemp(join(tmpdir(), 'apiagex-entries-')), 'content-types.db');
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
          title: 'Hello',
        },
        status: 'draft',
      },
    });
    const updated = await app.inject({
      headers: bearerHeaders(token),
      method: 'PUT',
      url: '/admin/content-types/articles/entries/' + created.json().id,
      payload: {
        data: {
          title: 'Updated',
        },
        status: 'published',
      },
    });
    const deleted = await app.inject({
      headers: bearerHeaders(token),
      method: 'DELETE',
      url: '/admin/content-types/articles/entries/' + created.json().id,
    });

    await app.close();

    expect(created.statusCode).toBe(201);
    expect(created.json()).toMatchObject({
      contentTypeId: 'articles',
      data: { title: 'Hello' },
      status: 'draft',
    });
    expect(updated.statusCode).toBe(200);
    expect(updated.json()).toMatchObject({
      contentTypeId: 'articles',
      data: { title: 'Updated' },
      status: 'published',
    });
    expect(deleted.statusCode).toBe(204);
  });

  it('persists entries across restarts', async () => {
    const databaseFile = join(await mkdtemp(join(tmpdir(), 'apiagex-entries-')), 'content-types.db');

    {
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
            title: 'Persistent',
          },
          status: 'published',
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
        url: '/admin/content-types/articles/entries',
      });

      await app.close();

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        items: [
          {
            contentTypeId: 'articles',
            data: { title: 'Persistent' },
            status: 'published',
          },
        ],
      });
    }
  });

  it('rejects invalid entry payloads', async () => {
    const databaseFile = join(await mkdtemp(join(tmpdir(), 'apiagex-entries-')), 'content-types.db');
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
            key: 'publishedAt',
            label: 'Published at',
            repeatable: false,
            required: false,
            sortOrder: 1,
            type: 'date',
          },
        ],
        kind: 'collection',
        slug: 'articles',
      },
    });

    const missingRequired = await app.inject({
      headers: bearerHeaders(token),
      method: 'POST',
      url: '/admin/content-types/articles/entries',
      payload: {
        data: {
          publishedAt: '2026-04-30',
        },
        status: 'draft',
      },
    });

    const wrongType = await app.inject({
      headers: bearerHeaders(token),
      method: 'POST',
      url: '/admin/content-types/articles/entries',
      payload: {
        data: {
          publishedAt: 'invalid-date',
          title: 123,
        },
        status: 'draft',
      },
    });

    await app.close();

    expect(missingRequired.statusCode).toBe(400);
    expect(missingRequired.json()).toMatchObject({
      message: 'Missing required field: Title',
    });
    expect(wrongType.statusCode).toBe(400);
    expect(wrongType.json()).toMatchObject({
      message: 'Invalid field type: Title',
    });
  });

  it('requires a publish at value for scheduled entries', async () => {
    const databaseFile = join(await mkdtemp(join(tmpdir(), 'apiagex-entries-')), 'content-types.db');
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

    const scheduledWithoutPublishAt = await app.inject({
      headers: bearerHeaders(token),
      method: 'POST',
      url: '/admin/content-types/articles/entries',
      payload: {
        data: {
          title: 'Timed article',
        },
        status: 'scheduled',
      },
    });

    await app.close();

    expect(scheduledWithoutPublishAt.statusCode).toBe(400);
    expect(scheduledWithoutPublishAt.json()).toMatchObject({
      message: 'Publish at is required for scheduled entries',
    });
  });

  it('searches, sorts, and paginates entries', async () => {
    const databaseFile = join(await mkdtemp(join(tmpdir(), 'apiagex-entries-')), 'content-types.db');
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

    for (const title of ['Alpha', 'Beta', 'Gamma']) {
      await app.inject({
        headers: bearerHeaders(token),
        method: 'POST',
        url: '/admin/content-types/articles/entries',
        payload: { data: { title }, status: 'published' },
      });
    }

    const firstPage = await app.inject({
      headers: bearerHeaders(token),
      method: 'GET',
      url: '/admin/content-types/articles/entries?pageSize=1&sort=oldest',
    });
    const secondPage = await app.inject({
      headers: bearerHeaders(token),
      method: 'GET',
      url: '/admin/content-types/articles/entries?page=2&pageSize=1&sort=oldest',
    });
    const search = await app.inject({
      headers: bearerHeaders(token),
      method: 'GET',
      url: '/admin/content-types/articles/entries?q=beta',
    });

    await app.close();

    expect(firstPage.statusCode).toBe(200);
    expect(firstPage.json()).toMatchObject({
      counts: { pendingApproval: 0, total: 3 },
      page: 1,
      pages: 3,
      pageSize: 1,
      items: [expect.objectContaining({ data: { title: 'Alpha' } })],
      total: 3,
    });
    expect(secondPage.statusCode).toBe(200);
    expect(secondPage.json()).toMatchObject({
      page: 2,
      pages: 3,
      pageSize: 1,
      items: [expect.objectContaining({ data: { title: 'Beta' } })],
      total: 3,
    });
    expect(search.statusCode).toBe(200);
    expect(search.json()).toMatchObject({
      counts: { pendingApproval: 0, total: 1 },
      page: 1,
      pages: 1,
      items: [expect.objectContaining({ data: { title: 'Beta' } })],
      total: 1,
    });
  });

  it('approves and rejects pending approval entries', async () => {
    const databaseFile = join(await mkdtemp(join(tmpdir(), 'apiagex-entries-')), 'content-types.db');
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

    const pending = await app.inject({
      headers: bearerHeaders(token),
      method: 'POST',
      url: '/admin/content-types/articles/entries',
      payload: {
        data: {
          title: 'Needs review',
        },
        status: 'pendingApproval',
      },
    });

    const pendingList = await app.inject({
      headers: bearerHeaders(token),
      method: 'GET',
      url: '/admin/content-types/articles/entries?status=pendingApproval',
    });

    const approved = await app.inject({
      headers: bearerHeaders(token),
      method: 'POST',
      url: `/admin/content-types/articles/entries/${pending.json().id}/approve`,
    });

    const pendingTwo = await app.inject({
      headers: bearerHeaders(token),
      method: 'POST',
      url: '/admin/content-types/articles/entries',
      payload: {
        data: {
          title: 'Reject me',
        },
        status: 'pendingApproval',
      },
    });

    const rejected = await app.inject({
      headers: bearerHeaders(token),
      method: 'POST',
      url: `/admin/content-types/articles/entries/${pendingTwo.json().id}/reject`,
    });

    await app.close();

    expect(pending.statusCode).toBe(201);
    expect(pending.json()).toMatchObject({
      status: 'pendingApproval',
    });
    expect(pendingList.statusCode).toBe(200);
    expect(pendingList.json()).toMatchObject({
      counts: {
        pendingApproval: 1,
        total: 1,
      },
      page: 1,
      pages: 1,
      pageSize: 10,
      items: [
        expect.objectContaining({
          status: 'pendingApproval',
        }),
      ],
      total: 1,
    });
    expect(approved.statusCode).toBe(200);
    expect(approved.json()).toMatchObject({
      status: 'published',
      publishAt: null,
    });
    expect(pendingTwo.statusCode).toBe(201);
    expect(rejected.statusCode).toBe(200);
    expect(rejected.json()).toMatchObject({
      status: 'draft',
      publishAt: null,
    });
  });

});
