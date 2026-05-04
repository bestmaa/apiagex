import { canAccessContentType } from './content-type-permissions.js';
import type { ContentTypePermissionAction, ContentTypePermissions } from './content-types.routes.type.js';
import type { PermissionAction } from './permission-actions.type.js';
import { canEvaluatePermission } from './permission-evaluator.js';
import type { PermissionCatalog } from './permission-evaluator.type.js';
import type { RolesRepository } from './roles.repository.type.js';

const CONTENT_TYPE_SCOPE_PREFIX = 'content-types:';

export function canAccessContentTypeWithRoleCatalog(
  rolesRepository: Pick<RolesRepository, 'get' | 'getByName'>,
  contentTypeId: string,
  permissions: ContentTypePermissions,
  action: ContentTypePermissionAction,
  role: string | null | undefined,
): boolean {
  if (role === 'owner' || role === 'admin') {
    return true;
  }

  const scope = `${CONTENT_TYPE_SCOPE_PREFIX}${contentTypeId}`;
  const roleRecord = rolesRepository.get(role ?? '') ?? rolesRepository.getByName(role ?? '');
  const evaluatorAction = toPermissionAction(action);

  return canEvaluatePermission({
    action: evaluatorAction,
    fallbackPermissions: toFallbackCatalog(scope, permissions, action, role),
    permissions: toRoleCatalog(scope, roleRecord?.permissions?.[scope], action),
    role,
    scope,
  });
}

function toPermissionAction(action: ContentTypePermissionAction): PermissionAction {
  return action === 'list' ? 'read' : action;
}

function toRoleCatalog(
  scope: string,
  actions: Record<string, boolean> | undefined,
  action: ContentTypePermissionAction,
): PermissionCatalog {
  if (!actions || typeof actions[action] !== 'boolean') {
    return {};
  }

  return {
    [scope]: {
      [toPermissionAction(action)]: actions[action],
    },
  };
}

function toFallbackCatalog(
  scope: string,
  permissions: ContentTypePermissions,
  action: ContentTypePermissionAction,
  role: string | null | undefined,
): PermissionCatalog {
  return {
    [scope]: {
      [toPermissionAction(action)]: canAccessContentType(permissions, action, role),
    },
  };
}
