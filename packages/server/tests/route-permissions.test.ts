import fastify from 'fastify';
import { describe, expect, it } from 'vitest';

import { readRoutePermission, ROUTE_PERMISSION_CONFIG_KEY, withRoutePermission } from '../src/route-permissions.js';

describe('route permission metadata', () => {
  it('attaches and reads permission metadata from a Fastify route', async () => {
    const app = fastify({ logger: false });

    app.get('/roles', withRoutePermission({ action: 'read', scope: 'system:roles' }), async (request) => ({
      permission: readRoutePermission(request),
    }));

    const response = await app.inject({ method: 'GET', url: '/roles' });
    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      permission: {
        action: 'read',
        scope: 'system:roles',
      },
    });
  });

  it('preserves existing route config values', () => {
    const options = withRoutePermission(
      { action: 'manage', scope: 'system:roles' },
      { config: { auditScope: 'roles' } },
    );

    expect(options.config).toEqual({
      auditScope: 'roles',
      [ROUTE_PERMISSION_CONFIG_KEY]: {
        action: 'manage',
        scope: 'system:roles',
      },
    });
  });
});
