import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { requireAdminToken } from './auth.js';
import { canEvaluatePermission } from './permission-evaluator.js';
import type { PermissionAction } from './permission-actions.type.js';
import { withRoutePermission } from './route-permissions.js';
import type { RegisterRolesRoutesOptions, RoleInput } from './roles.routes.type.js';

const ROLES_SCOPE = 'system:roles';

export async function registerRolesRoutes(
  app: FastifyInstance,
  options: RegisterRolesRoutesOptions,
): Promise<void> {
  const readGuard = createRolesGuard(options, 'read');
  const manageGuard = createRolesGuard(options, 'manage');

  app.get('/admin/roles', withRoutePermission({ action: 'read', scope: ROLES_SCOPE }, { preHandler: readGuard }), async () => ({
    items: options.repository.list(),
    status: 'ok',
  }));

  app.post('/admin/roles', withRoutePermission({ action: 'manage', scope: ROLES_SCOPE }, { preHandler: manageGuard }), async (request, reply) => {
    const input = parseRoleInput(request.body);

    if (!input) {
      return reply.code(400).send({ message: 'Invalid role input' });
    }

    if (options.repository.get(input.id) || options.repository.getByName(input.name)) {
      return reply.code(409).send({ message: 'Role already exists' });
    }

    return reply.code(201).send(options.repository.create(input));
  });

  app.put('/admin/roles/:id', withRoutePermission({ action: 'manage', scope: ROLES_SCOPE }, { preHandler: manageGuard }), async (request, reply) => {
    const { id } = request.params as { id: string };
    const input = parseRoleInput(request.body, id);

    if (!input) {
      return reply.code(400).send({ message: 'Invalid role input' });
    }

    const existing = options.repository.get(id);

    if (!existing) {
      return reply.code(404).send({ message: 'Role not found' });
    }

    const duplicate = options.repository.getByName(input.name);
    if (duplicate && duplicate.id !== id) {
      return reply.code(409).send({ message: 'Role already exists' });
    }

    const record = options.repository.update(id, input);

    if (!record) {
      return reply.code(404).send({ message: 'Role not found' });
    }

    return reply.send(record);
  });

  app.delete('/admin/roles/:id', withRoutePermission({ action: 'manage', scope: ROLES_SCOPE }, { preHandler: manageGuard }), async (request, reply) => {
    const { id } = request.params as { id: string };

    if (options.repository.isBuiltIn(id)) {
      return reply.code(403).send({ message: 'Built-in role cannot be deleted' });
    }

    if (!options.repository.delete(id)) {
      return reply.code(404).send({ message: 'Role not found' });
    }

    return reply.code(204).send();
  });
}

function createRolesGuard(options: RegisterRolesRoutesOptions, action: PermissionAction) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const session = requireAdminToken(options.auth, request.headers.authorization);

    if (!session) {
      return reply.code(401).send({ message: 'Authentication required' });
    }

    const roleRecord = options.repository.get(session.role) ?? options.repository.getByName(session.role);
    const allowed = canEvaluatePermission({
      action,
      fallbackPermissions: defaultRolesFallback(session.role),
      permissions: roleRecord?.permissions ?? {},
      role: session.role,
      scope: ROLES_SCOPE,
    });

    if (!allowed) {
      return reply.code(403).send({ message: 'Forbidden' });
    }
  };
}

function defaultRolesFallback(role: string) {
  return {
    [ROLES_SCOPE]: {
      manage: role === 'admin',
      read: role === 'admin',
    },
  };
}

function parseRoleInput(body: unknown, fallbackId?: string): RoleInput | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return null;
  }

  const input = body as Record<string, unknown>;
  const id = normalizeText(typeof input.id === 'string' ? input.id : fallbackId);
  const name = normalizeText(typeof input.name === 'string' ? input.name : undefined);

  if (!id || !name) {
    return null;
  }

  if (typeof input.id === 'string' && fallbackId && normalizeText(input.id) !== fallbackId) {
    return null;
  }

  const permissions: NonNullable<RoleInput['permissions']> | null =
    typeof input.permissions === 'undefined' ? {} : parsePermissions(input.permissions);

  if (permissions === null) {
    return null;
  }

  return {
    description: typeof input.description === 'string' ? input.description.trim() : '',
    id,
    name,
    permissions,
  };
}

function parsePermissions(value: unknown): NonNullable<RoleInput['permissions']> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const permissions: NonNullable<RoleInput['permissions']> = {};

  for (const [scope, actions] of Object.entries(value as Record<string, unknown>)) {
    if (!actions || typeof actions !== 'object' || Array.isArray(actions)) {
      return null;
    }

    const normalizedActions: Record<string, boolean> = {};

    for (const [action, allowed] of Object.entries(actions as Record<string, unknown>)) {
      if (typeof allowed === 'boolean') {
        normalizedActions[action] = allowed;
      } else {
        return null;
      }
    }

    permissions[scope] = normalizedActions;
  }

  return permissions;
}

function normalizeText(value: string | undefined): string {
  return value?.trim() ?? '';
}
