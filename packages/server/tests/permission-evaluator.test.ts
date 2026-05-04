import { describe, expect, it } from 'vitest';

import { canEvaluatePermission } from '../src/permission-evaluator.js';
import type { PermissionCatalog } from '../src/permission-evaluator.type.js';

describe('permission evaluator', () => {
  it('allows owner regardless of catalog state', () => {
    expect(canEvaluatePermission({
      action: 'delete',
      permissions: null,
      role: 'owner',
      scope: 'system:roles',
    })).toBe(true);
  });

  it('allows exact true permissions', () => {
    const permissions: PermissionCatalog = {
      'content-types:posts': {
        read: true,
      },
    };

    expect(canEvaluatePermission({
      action: 'read',
      permissions,
      role: 'editor',
      scope: 'content-types:posts',
    })).toBe(true);
  });

  it('denies missing scopes, missing actions, and false values', () => {
    const permissions: PermissionCatalog = {
      'content-types:posts': {
        delete: false,
      },
    };

    expect(canEvaluatePermission({
      action: 'read',
      permissions,
      role: 'editor',
      scope: 'content-types:posts',
    })).toBe(false);
    expect(canEvaluatePermission({
      action: 'read',
      permissions,
      role: 'editor',
      scope: 'content-types:pages',
    })).toBe(false);
    expect(canEvaluatePermission({
      action: 'delete',
      permissions,
      role: 'editor',
      scope: 'content-types:posts',
    })).toBe(false);
  });
});
