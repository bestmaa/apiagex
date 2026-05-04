export const ACTIONS = ['create', 'read', 'list', 'update', 'delete'];

const BUILT_IN_ROLE_IDS = new Set(['admin', 'editor', 'owner', 'viewer']);

export function canManageRoles(role) {
  return role === 'admin' || role === 'owner';
}

export function isBuiltInRole(id) {
  return BUILT_IN_ROLE_IDS.has(id);
}

export function createDefaultMatrixPermissions(contentTypes) {
  const permissions = {};

  for (const contentType of contentTypes) {
    permissions[getScopeKey(contentType.id)] = createEmptyActions();
  }

  return permissions;
}

export function ensureMatrixScope(store, scope) {
  if (!store[scope]) {
    store[scope] = createEmptyActions();
  }

  return store[scope];
}

export function splitCurrentPermissions(contentTypes, permissions) {
  const currentScopes = new Set(contentTypes.map((contentType) => getScopeKey(contentType.id)));
  const current = {};

  for (const scope of currentScopes) {
    current[scope] = createEmptyActions();
  }

  for (const [scope, actions] of Object.entries(permissions ?? {})) {
    if (!currentScopes.has(scope)) {
      continue;
    }

    current[scope] = normalizeActions(actions);
  }

  return current;
}

export function splitPreservedPermissions(contentTypes, permissions) {
  const currentScopes = new Set(contentTypes.map((contentType) => getScopeKey(contentType.id)));
  const preserved = {};

  for (const [scope, actions] of Object.entries(permissions ?? {})) {
    if (currentScopes.has(scope)) {
      continue;
    }

    preserved[scope] = normalizeActions(actions);
  }

  return preserved;
}

export function buildPermissionsPayload(contentTypes, preservedPermissions, currentPermissions) {
  const payload = {
    ...clonePermissions(preservedPermissions),
    ...clonePermissions(currentPermissions),
  };

  for (const contentType of contentTypes) {
    const scope = getScopeKey(contentType.id);
    payload[scope] = normalizeActions(payload[scope]);
  }

  return payload;
}

export function summarizeRolePermissions(permissions, fallbackText) {
  if (!permissions || typeof permissions !== 'object') {
    return fallbackText;
  }

  const segments = [];

  for (const [scope, actions] of Object.entries(permissions)) {
    if (!scope.startsWith('content-types:')) {
      continue;
    }

    const enabled = ACTIONS.filter((action) => Boolean(actions?.[action]));

    if (!enabled.length) {
      continue;
    }

    segments.push(`${scope.slice('content-types:'.length)}: ${enabled.join(', ')}`);
  }

  return segments.length ? segments.join(' | ') : fallbackText;
}

export function getScopeKey(contentTypeId) {
  return `content-types:${contentTypeId}`;
}

function clonePermissions(permissions) {
  const clone = {};

  for (const [scope, actions] of Object.entries(permissions ?? {})) {
    clone[scope] = normalizeActions(actions);
  }

  return clone;
}

function createEmptyActions() {
  return {
    create: false,
    delete: false,
    list: false,
    read: false,
    update: false,
  };
}

function normalizeActions(actions) {
  const normalized = createEmptyActions();

  for (const action of ACTIONS) {
    if (typeof actions?.[action] === 'boolean') {
      normalized[action] = actions[action];
    }
  }

  return normalized;
}
