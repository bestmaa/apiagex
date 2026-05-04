import type {
  ContentTypePermissionAction,
  ContentTypePermissions,
  ContentTypePermissionsInput,
} from './content-types.routes.type.js';

export const DEFAULT_CONTENT_TYPE_PERMISSIONS: ContentTypePermissions = {
  create: ['admin', 'editor'],
  delete: ['admin'],
  list: ['admin', 'editor', 'viewer'],
  read: ['admin', 'editor', 'viewer'],
  update: ['admin'],
};

export function normalizeContentTypePermissions(
  input: ContentTypePermissionsInput | undefined,
): ContentTypePermissions {
  return {
    create: normalizeRoleList(input?.create, DEFAULT_CONTENT_TYPE_PERMISSIONS.create),
    delete: normalizeRoleList(input?.delete, DEFAULT_CONTENT_TYPE_PERMISSIONS.delete),
    list: normalizeRoleList(input?.list, DEFAULT_CONTENT_TYPE_PERMISSIONS.list),
    read: normalizeRoleList(input?.read, DEFAULT_CONTENT_TYPE_PERMISSIONS.read),
    update: normalizeRoleList(input?.update, DEFAULT_CONTENT_TYPE_PERMISSIONS.update),
  };
}

export function canAccessContentType(
  permissions: ContentTypePermissions,
  action: ContentTypePermissionAction,
  role: string | null | undefined,
): boolean {
  if (role === 'owner' || role === 'admin') {
    return true;
  }

  if (!role) {
    return false;
  }

  return permissions[action].includes(role);
}

export function canAccessContentTypeAnonymously(
  permissions: ContentTypePermissions,
  action: ContentTypePermissionAction,
): boolean {
  return permissions[action].includes('viewer');
}

export function getContentTypePermissionList(
  permissions: ContentTypePermissions,
  action: ContentTypePermissionAction,
): readonly string[] {
  return permissions[action];
}

function normalizeRoleList(
  value: readonly string[] | undefined,
  fallback: readonly string[],
): readonly string[] {
  if (typeof value === 'undefined') {
    return [...fallback];
  }

  return Array.from(new Set(value.map((item) => item.trim()).filter((item) => item.length > 0)));
}
