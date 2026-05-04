import type { FastifyReply, FastifyRequest } from 'fastify';

import { requireAdminToken } from './auth.js';
import type { AdminAuthService, AdminRole } from './auth.type.js';
import type { AdminPermissionAction, AdminPermissionScope } from './permissions.type.js';

export const DEFAULT_ROLE_PERMISSIONS: Record<AdminRole, Record<AdminPermissionScope, Record<AdminPermissionAction, boolean>>> = {
  owner: {
    'media-files': { read: true, write: true },
    'content-entries': { read: true, write: true },
    'content-fields': { read: true, write: true },
    'content-types': { read: true, write: true },
  },
  admin: {
    'media-files': { read: true, write: true },
    'content-entries': { read: true, write: true },
    'content-fields': { read: true, write: true },
    'content-types': { read: true, write: true },
  },
  editor: {
    'media-files': { read: true, write: true },
    'content-entries': { read: true, write: true },
    'content-fields': { read: true, write: false },
    'content-types': { read: true, write: false },
  },
  viewer: {
    'media-files': { read: false, write: false },
    'content-entries': { read: true, write: false },
    'content-fields': { read: true, write: false },
    'content-types': { read: true, write: false },
  },
};

export function canAccess(role: AdminRole, scope: AdminPermissionScope, action: AdminPermissionAction): boolean {
  return (DEFAULT_ROLE_PERMISSIONS[role] ?? DEFAULT_ROLE_PERMISSIONS.viewer)[scope][action];
}

export function createPermissionGuard(
  auth: AdminAuthService,
  scope: AdminPermissionScope,
  action: AdminPermissionAction,
): (request: FastifyRequest, reply: FastifyReply) => Promise<void | never> {
  return async (request, reply) => {
    const session = requireAdminToken(auth, request.headers.authorization);

    if (!session) {
      return reply.code(401).send({ message: 'Authentication required' });
    }

    if (!canAccess(session.role, scope, action)) {
      return reply.code(403).send({ message: 'Forbidden' });
    }
  };
}

export function createAdminOnlyGuard(
  auth: AdminAuthService,
): (request: FastifyRequest, reply: FastifyReply) => Promise<void | never> {
  return async (request, reply) => {
    const session = requireAdminToken(auth, request.headers.authorization);

    if (!session) {
      return reply.code(401).send({ message: 'Authentication required' });
    }

    if (session.role !== 'admin' && session.role !== 'owner') {
      return reply.code(403).send({ message: 'Forbidden' });
    }
  };
}
