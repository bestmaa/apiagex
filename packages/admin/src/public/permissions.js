const MATRIX = {
  owner: {
    'audit-logs': { read: true, write: false },
    'content-entries': { read: true, write: true },
    'content-fields': { read: true, write: true },
    'content-types': { read: true, write: true },
    'media-files': { read: true, write: true },
  },
  admin: {
    'audit-logs': { read: true, write: false },
    'content-entries': { read: true, write: true },
    'content-fields': { read: true, write: true },
    'content-types': { read: true, write: true },
    'media-files': { read: true, write: true },
  },
  editor: {
    'audit-logs': { read: false, write: false },
    'content-entries': { read: true, write: true },
    'content-fields': { read: true, write: false },
    'content-types': { read: true, write: false },
    'media-files': { read: true, write: true },
  },
  viewer: {
    'audit-logs': { read: false, write: false },
    'content-entries': { read: true, write: false },
    'content-fields': { read: true, write: false },
    'content-types': { read: true, write: false },
    'media-files': { read: false, write: false },
  },
};

export function canAccess(role, scope, action) {
  return Boolean((MATRIX[role] ?? MATRIX.viewer)[scope]?.[action]);
}
