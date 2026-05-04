import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildServer } from '../src/app.js';
import { bearerHeaders, createRoleToken, loginAdmin } from './auth-test-utils.js';

describe('public routes permissions', () => {
  it('uses role catalog permissions for authenticated public access', async () => {
    const databaseFile = join(await mkdtemp(join(tmpdir(), 'apiagex-server-')), 'content-types.db');
    const app = await buildServer({ contentTypesDatabaseFile: databaseFile, logger: false });
    const adminToken = await loginAdmin(app);

    await app.inject({
      headers: bearerHeaders(adminToken),
      method: 'POST',
      url: '/admin/content-types',
      payload: {
        displayName: 'Secure Article',
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
        slug: 'secure-articles',
      },
    });

    await app.inject({
      headers: bearerHeaders(adminToken),
      method: 'POST',
      url: '/admin/roles',
      payload: {
        id: 'public-reader',
        name: 'Public Reader',
        permissions: {
          'content-types:secure-articles': {
            create: false,
            delete: false,
            list: true,
            read: true,
            update: false,
          },
        },
      },
    });

    await app.inject({
      headers: bearerHeaders(adminToken),
      method: 'POST',
      url: '/admin/content-types/secure-articles/entries',
      payload: {
        data: {
          title: 'Protected article',
        },
        status: 'published',
      },
    });

    const anonymous = await app.inject({
      method: 'GET',
      url: '/api/secure-articles',
    });
    const readerToken = createRoleToken('public-reader');
    const authorized = await app.inject({
      headers: bearerHeaders(readerToken),
      method: 'GET',
      url: '/api/secure-articles',
    });

    await app.close();

    expect(anonymous.statusCode).toBe(401);
    expect(authorized.statusCode).toBe(200);
    expect(authorized.json()).toMatchObject({
      items: [
        expect.objectContaining({
          data: {
            title: 'Protected article',
          },
        }),
      ],
      status: 'ok',
    });
  });

  it('returns 401 without a token when public access is not enabled', async () => {
    const databaseFile = join(await mkdtemp(join(tmpdir(), 'apiagex-server-')), 'content-types.db');
    const app = await buildServer({ contentTypesDatabaseFile: databaseFile, logger: false });
    const adminToken = await loginAdmin(app);

    await app.inject({
      headers: bearerHeaders(adminToken),
      method: 'POST',
      url: '/admin/content-types',
      payload: {
        displayName: 'Secure Article',
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
          create: ['editor'],
          delete: ['editor'],
          list: ['editor'],
          read: ['editor'],
          update: ['editor'],
        },
        slug: 'secure-articles',
      },
    });
    await app.inject({
      headers: bearerHeaders(adminToken),
      method: 'POST',
      url: '/admin/content-types/secure-articles/entries',
      payload: {
        data: {
          title: 'Protected article',
        },
        status: 'published',
      },
    });

    const anonymous = await app.inject({
      method: 'GET',
      url: '/api/secure-articles',
    });
    const editorToken = createRoleToken('editor');
    const authorized = await app.inject({
      headers: bearerHeaders(editorToken),
      method: 'GET',
      url: '/api/secure-articles',
    });

    await app.close();

    expect(anonymous.statusCode).toBe(401);
    expect(anonymous.json()).toMatchObject({
      message: 'Authentication required',
    });
    expect(authorized.statusCode).toBe(200);
    expect(authorized.json()).toMatchObject({
      items: [
        expect.objectContaining({
          data: {
            title: 'Protected article',
          },
        }),
      ],
      status: 'ok',
    });
  });
});
