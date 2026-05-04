import type { FastifyRequest } from 'fastify';

import { isPermissionAction } from './permission-actions.js';
import type { RoutePermissionMetadata, RoutePermissionOptions } from './route-permissions.type.js';

export const ROUTE_PERMISSION_CONFIG_KEY = 'apiagexPermission';

export function withRoutePermission(
  permission: RoutePermissionMetadata,
  options: RoutePermissionOptions = {},
): RoutePermissionOptions {
  return {
    ...options,
    config: {
      ...options.config,
      [ROUTE_PERMISSION_CONFIG_KEY]: permission,
    },
  };
}

export function readRoutePermission(request: FastifyRequest): RoutePermissionMetadata | null {
  const config = request.routeOptions.config as unknown as Record<string, unknown> | undefined;
  const value = config?.[ROUTE_PERMISSION_CONFIG_KEY];

  if (!isRoutePermissionMetadata(value)) {
    return null;
  }

  return value;
}

function isRoutePermissionMetadata(value: unknown): value is RoutePermissionMetadata {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const record = value as Partial<RoutePermissionMetadata>;

  return typeof record.scope === 'string' && record.scope.length > 0 && isPermissionAction(record.action);
}
