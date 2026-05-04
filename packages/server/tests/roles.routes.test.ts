import { describe, expect, it } from 'vitest';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { buildServer } from '../src/app.js';
import { bearerHeaders, loginAdmin, loginEditor } from './auth-test-utils.js';

describe('roles routes', () => {
  it('lists built-in roles, creates a custom role, and updates it', async () => {
    const databaseFile = join(await mkdtemp(join(tmpdir(), 'apiagex-server-')), 'roles.db');
    const app = await buildServer({
      contentTypesDatabaseFile: databaseFile,
      editorEmail: 'editor@example.com',
      editorPassword: 'editor123',
      logger: false,
    });
    const token = await loginAdmin(app);

    const created = await app.inject({
      headers: bearerHeaders(token),
      method: 'POST',
      url: '/admin/roles',
      payload: {
        description: 'Marketing content editors',
        id: 'marketing-editor',
        name: 'Marketing Editor',
        permissions: {
          'content-entries': {
            read: true,
            write: true,
          },
          'content-types': {
            read: true,
            write: false,
          },
        },
      },
    });

    const updated = await app.inject({
      headers: bearerHeaders(token),
      method: 'PUT',
      url: '/admin/roles/marketing-editor',
      payload: {
        description: 'Updated description',
        id: 'marketing-editor',
        name: 'Marketing Editor',
        permissions: {
          'content-entries': {
            read: true,
            write: false,
          },
          'content-types': {
            read: true,
            write: false,
          },
        },
      },
    });

    const listed = await app.inject({
      headers: bearerHeaders(token),
      method: 'GET',
      url: '/admin/roles',
    });

    await app.close();

    expect(created.statusCode).toBe(201);
    expect(created.json()).toMatchObject({
      description: 'Marketing content editors',
      id: 'marketing-editor',
      name: 'Marketing Editor',
      permissions: {
        'content-entries': {
          read: true,
          write: true,
        },
        'content-types': {
          read: true,
          write: false,
        },
      },
    });
    expect(updated.statusCode).toBe(200);
    expect(updated.json()).toMatchObject({
      description: 'Updated description',
      id: 'marketing-editor',
      name: 'Marketing Editor',
      permissions: {
        'content-entries': {
          read: true,
          write: false,
        },
      },
    });
    expect(listed.statusCode).toBe(200);
    expect(listed.json()).toMatchObject({
      items: expect.arrayContaining([
        expect.objectContaining({ id: 'admin', name: 'Admin' }),
        expect.objectContaining({ id: 'editor', name: 'Editor' }),
        expect.objectContaining({ id: 'marketing-editor', name: 'Marketing Editor' }),
        expect.objectContaining({ id: 'owner', name: 'Owner' }),
        expect.objectContaining({ id: 'viewer', name: 'Viewer' }),
      ]),
      status: 'ok',
    });
  });

  it('rejects non-admin role management access', async () => {
    const databaseFile = join(await mkdtemp(join(tmpdir(), 'apiagex-server-')), 'roles.db');
    const app = await buildServer({
      contentTypesDatabaseFile: databaseFile,
      editorEmail: 'editor@example.com',
      editorPassword: 'editor123',
      logger: false,
    });
    const token = await loginEditor(app);
    const response = await app.inject({
      headers: bearerHeaders(token),
      method: 'POST',
      url: '/admin/roles',
      payload: {
        id: 'content-writer',
        name: 'Content Writer',
        permissions: {
          'content-entries': {
            read: true,
            write: true,
          },
        },
      },
    });

    await app.close();

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({
      message: 'Forbidden',
    });
  });

  it('blocks deleting built-in roles', async () => {
    const databaseFile = join(await mkdtemp(join(tmpdir(), 'apiagex-server-')), 'roles.db');
    const app = await buildServer({ contentTypesDatabaseFile: databaseFile, logger: false });
    const token = await loginAdmin(app);
    const response = await app.inject({
      headers: bearerHeaders(token),
      method: 'DELETE',
      url: '/admin/roles/admin',
    });

    await app.close();

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({
      message: 'Built-in role cannot be deleted',
    });
  });

  it('persists custom roles across restarts', async () => {
    const databaseFile = join(await mkdtemp(join(tmpdir(), 'apiagex-server-')), 'roles.db');

    {
      const app = await buildServer({ contentTypesDatabaseFile: databaseFile, logger: false });
      const token = await loginAdmin(app);

      await app.inject({
        headers: bearerHeaders(token),
        method: 'POST',
        url: '/admin/roles',
        payload: {
          description: 'Customer support editors',
          id: 'support-editor',
          name: 'Support Editor',
          permissions: {
            'content-entries': {
              read: true,
              write: true,
            },
          },
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
        url: '/admin/roles',
      });

      await app.close();

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        items: expect.arrayContaining([
          expect.objectContaining({ id: 'support-editor', name: 'Support Editor' }),
        ]),
      });
    }
  });
});
