import { canAccessContentType } from './content-type-permissions.js';
import type { ContentTypePermissionAction, ContentTypePermissions } from './content-types.routes.type.js';
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
  const scopedPermissions = roleRecord?.permissions?.[scope];

  if (scopedPermissions) {
    return Boolean(scopedPermissions[action]);
  }

  return canAccessContentType(permissions, action, role);
}
