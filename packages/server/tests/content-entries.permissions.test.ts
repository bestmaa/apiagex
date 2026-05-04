import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildServer } from '../src/app.js';
import { bearerHeaders, createRoleToken, loginAdmin, loginEditor, loginViewer } from './auth-test-utils.js';

describe('content entry permissions', () => {
  it('allows a custom role to create when role catalog permission allows', async () => {
    const databaseFile = join(await mkdtemp(join(tmpdir(), 'apiagex-server-')), 'content-types.db');
    const app = await buildServer({ contentTypesDatabaseFile: databaseFile, logger: false });
    const adminToken = await loginAdmin(app);

    await createArticleType(app, adminToken);
    const roleResponse = await app.inject({
      headers: bearerHeaders(adminToken),
      method: 'POST',
      url: '/admin/roles',
      payload: {
        id: 'catalog-writer',
        name: 'Catalog Writer',
        permissions: {
          'content-types:articles': {
            create: true,
            delete: false,
            list: false,
            read: false,
            update: false,
          },
        },
      },
    });

    const customRoleToken = createRoleToken('catalog-writer');
    const created = await app.inject({
      headers: bearerHeaders(customRoleToken),
      method: 'POST',
      url: '/admin/content-types/articles/entries',
      payload: {
        data: {
          title: 'Custom role entry',
        },
        status: 'draft',
      },
    });

    await app.close();

    expect(roleResponse.statusCode).toBe(201);
    expect(created.statusCode).toBe(201);
  });

  it('allows custom role read but blocks update when role catalog permission allows read only', async () => {
    const databaseFile = join(await mkdtemp(join(tmpdir(), 'apiagex-server-')), 'content-types.db');
    const app = await buildServer({ contentTypesDatabaseFile: databaseFile, logger: false });
    const adminToken = await loginAdmin(app);

    await createArticleType(app, adminToken);
    await app.inject({
      headers: bearerHeaders(adminToken),
      method: 'POST',
      url: '/admin/roles',
      payload: {
        id: 'catalog-reader',
        name: 'Catalog Reader',
        permissions: {
          'content-types:articles': {
            create: false,
            delete: false,
            list: true,
            read: true,
            update: false,
          },
        },
      },
    });

    const created = await createArticleEntry(app, adminToken, 'Readable article');
    const entryId = created.json().id as string;
    const customRoleToken = createRoleToken('catalog-reader');
    const readable = await app.inject({
      headers: bearerHeaders(customRoleToken),
      method: 'GET',
      url: `/admin/content-types/articles/entries/${entryId}`,
    });
    const blocked = await app.inject({
      headers: bearerHeaders(customRoleToken),
      method: 'PUT',
      url: `/admin/content-types/articles/entries/${entryId}`,
      payload: {
        data: {
          title: 'Updated by reader',
        },
        status: 'draft',
      },
    });

    await app.close();

    expect(readable.statusCode).toBe(200);
    expect(blocked.statusCode).toBe(403);
    expect(blocked.json()).toMatchObject({
      message: 'Forbidden',
    });
  });

  it('returns 403 when role catalog permission is missing', async () => {
    const databaseFile = join(await mkdtemp(join(tmpdir(), 'apiagex-server-')), 'content-types.db');
    const app = await buildServer({ contentTypesDatabaseFile: databaseFile, logger: false });
    const adminToken = await loginAdmin(app);

    await createArticleType(app, adminToken);
    await app.inject({
      headers: bearerHeaders(adminToken),
      method: 'POST',
      url: '/admin/roles',
      payload: {
        id: 'catalog-missing',
        name: 'Catalog Missing',
        permissions: {},
      },
    });

    const customRoleToken = createRoleToken('catalog-missing');
    const blocked = await app.inject({
      headers: bearerHeaders(customRoleToken),
      method: 'POST',
      url: '/admin/content-types/articles/entries',
      payload: {
        data: {
          title: 'Missing permission',
        },
        status: 'draft',
      },
    });

    await app.close();

    expect(blocked.statusCode).toBe(403);
    expect(blocked.json()).toMatchObject({
      message: 'Forbidden',
    });
  });

  it('allows owner and admin bypass', async () => {
    const databaseFile = join(await mkdtemp(join(tmpdir(), 'apiagex-server-')), 'content-types.db');
    const app = await buildServer({ contentTypesDatabaseFile: databaseFile, logger: false });
    const adminToken = await loginAdmin(app);

    await app.inject({
      headers: bearerHeaders(adminToken),
      method: 'POST',
      url: '/admin/content-types',
      payload: {
        displayName: 'Locked Article',
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
        permissions: {
          create: [],
          delete: [],
          list: [],
          read: [],
          update: [],
        },
        slug: 'locked-articles',
      },
    });

    const adminCreated = await app.inject({
      headers: bearerHeaders(adminToken),
      method: 'POST',
      url: '/admin/content-types/locked-articles/entries',
      payload: {
        data: {
          title: 'Admin entry',
        },
        status: 'draft',
      },
    });

    const ownerToken = createRoleToken('owner');
    const ownerCreated = await app.inject({
      headers: bearerHeaders(ownerToken),
      method: 'POST',
      url: '/admin/content-types/locked-articles/entries',
      payload: {
        data: {
          title: 'Owner entry',
        },
        status: 'draft',
      },
    });

    await app.close();

    expect(adminCreated.statusCode).toBe(201);
    expect(ownerCreated.statusCode).toBe(201);
  });

  it('allows viewers to read but not create', async () => {
    const databaseFile = join(await mkdtemp(join(tmpdir(), 'apiagex-server-')), 'content-types.db');
    const app = await buildServer({
      contentTypesDatabaseFile: databaseFile,
      editorEmail: 'editor@example.com',
      editorPassword: 'editor123',
      logger: false,
      viewerEmail: 'viewer@example.com',
      viewerPassword: 'viewer123',
    });
    const adminToken = await loginAdmin(app);

    await createArticleType(app, adminToken);
    const created = await createArticleEntry(app, adminToken, 'Published article');
    const viewerToken = await loginViewer(app);
    const readable = await app.inject({
      headers: bearerHeaders(viewerToken),
      method: 'GET',
      url: `/admin/content-types/articles/entries/${created.json().id as string}`,
    });
    const blocked = await app.inject({
      headers: bearerHeaders(viewerToken),
      method: 'POST',
      url: '/admin/content-types/articles/entries',
      payload: {
        data: {
          title: 'Viewer draft',
        },
        status: 'draft',
      },
    });

    await app.close();

    expect(readable.statusCode).toBe(200);
    expect(readable.json()).toMatchObject({
      item: {
        data: {
          title: 'Published article',
        },
      },
      status: 'ok',
    });
    expect(blocked.statusCode).toBe(403);
    expect(blocked.json()).toMatchObject({
      message: 'Forbidden',
    });
  });

  it('allows editors to create but not delete', async () => {
    const databaseFile = join(await mkdtemp(join(tmpdir(), 'apiagex-server-')), 'content-types.db');
    const app = await buildServer({
      contentTypesDatabaseFile: databaseFile,
      editorEmail: 'editor@example.com',
      editorPassword: 'editor123',
      logger: false,
    });
    const adminToken = await loginAdmin(app);

    await createArticleType(app, adminToken);
    const editorToken = await loginEditor(app);
    const created = await app.inject({
      headers: bearerHeaders(editorToken),
      method: 'POST',
      url: '/admin/content-types/articles/entries',
      payload: {
        data: {
          title: 'Editor entry',
        },
        status: 'draft',
      },
    });
    const blocked = await app.inject({
      headers: bearerHeaders(editorToken),
      method: 'DELETE',
      url: `/admin/content-types/articles/entries/${created.json().id as string}`,
    });

    await app.close();

    expect(created.statusCode).toBe(201);
    expect(blocked.statusCode).toBe(403);
    expect(blocked.json()).toMatchObject({
      message: 'Forbidden',
    });
  });

  it('allows a custom role to list entries when only list is enabled', async () => {
    const databaseFile = join(await mkdtemp(join(tmpdir(), 'apiagex-server-')), 'content-types.db');
    const app = await buildServer({ contentTypesDatabaseFile: databaseFile, logger: false });
    const adminToken = await loginAdmin(app);

    await app.inject({
      headers: bearerHeaders(adminToken),
      method: 'POST',
      url: '/admin/content-types',
      payload: {
        displayName: 'Catalog',
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
        permissions: {
          create: [],
          delete: [],
          list: ['catalog-reader'],
          read: [],
          update: [],
        },
        slug: 'catalogs',
      },
    });

    await app.inject({
      headers: bearerHeaders(adminToken),
      method: 'POST',
      url: '/admin/content-types/catalogs/entries',
      payload: {
        data: {
          title: 'Listed entry',
        },
        status: 'published',
      },
    });

    const customRoleToken = createRoleToken('catalog-reader');
    const listed = await app.inject({
      headers: bearerHeaders(customRoleToken),
      method: 'GET',
      url: '/admin/content-types/catalogs/entries',
    });
    const blocked = await app.inject({
      headers: bearerHeaders(customRoleToken),
      method: 'POST',
      url: '/admin/content-types/catalogs/entries',
      payload: {
        data: {
          title: 'Blocked create',
        },
        status: 'draft',
      },
    });

    await app.close();

    expect(listed.statusCode).toBe(200);
    expect(listed.json()).toMatchObject({
      items: [
        expect.objectContaining({
          data: {
            title: 'Listed entry',
          },
        }),
      ],
      status: 'ok',
    });
    expect(blocked.statusCode).toBe(403);
    expect(blocked.json()).toMatchObject({
      message: 'Forbidden',
    });
  });
});

async function createArticleType(app: Awaited<ReturnType<typeof buildServer>>, token: string): Promise<void> {
  const response = await app.inject({
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

  expect(response.statusCode).toBe(201);
}

async function createArticleEntry(
  app: Awaited<ReturnType<typeof buildServer>>,
  token: string,
  title: string,
): Promise<any> {
  return app.inject({
    headers: bearerHeaders(token),
    method: 'POST',
    url: '/admin/content-types/articles/entries',
    payload: {
      data: {
        title,
      },
      status: 'published',
    },
  });
}
