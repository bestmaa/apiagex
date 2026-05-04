import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildServer } from '../src/app.js';
import { bearerHeaders, createRoleToken, loginAdmin } from './auth-test-utils.js';

describe('roles route permissions', () => {
  it('allows a custom role with system roles manage permission', async () => {
    const databaseFile = join(await mkdtemp(join(tmpdir(), 'apiagex-server-')), 'roles.db');
    const app = await buildServer({ contentTypesDatabaseFile: databaseFile, logger: false });
    const adminToken = await loginAdmin(app);

    await app.inject({
      headers: bearerHeaders(adminToken),
      method: 'POST',
      url: '/admin/roles',
      payload: {
        id: 'role-manager',
        name: 'Role Manager',
        permissions: {
          'system:roles': {
            manage: true,
            read: true,
          },
        },
      },
    });

    const managerToken = createRoleToken('role-manager');
    const created = await app.inject({
      headers: bearerHeaders(managerToken),
      method: 'POST',
      url: '/admin/roles',
      payload: {
        id: 'managed-role',
        name: 'Managed Role',
        permissions: {},
      },
    });

    await app.close();

    expect(created.statusCode).toBe(201);
  });

  it('lets explicit false block built-in admin roles fallback', async () => {
    const databaseFile = join(await mkdtemp(join(tmpdir(), 'apiagex-server-')), 'roles.db');
    const app = await buildServer({ contentTypesDatabaseFile: databaseFile, logger: false });
    const adminToken = await loginAdmin(app);

    await app.inject({
      headers: bearerHeaders(adminToken),
      method: 'PUT',
      url: '/admin/roles/admin',
      payload: {
        id: 'admin',
        name: 'Admin',
        permissions: {
          'system:roles': {
            manage: false,
            read: false,
          },
        },
      },
    });

    const blocked = await app.inject({
      headers: bearerHeaders(adminToken),
      method: 'GET',
      url: '/admin/roles',
    });

    await app.close();

    expect(blocked.statusCode).toBe(403);
  });
});
