import { describe, expect, it } from 'vitest';

import { isPermissionAction, PERMISSION_ACTIONS } from '../src/permission-actions.js';
import type { PermissionAction, PermissionActionMap } from '../src/permission-actions.type.js';

describe('permission actions', () => {
  it('exports the canonical RBAC V2 action order', () => {
    const actions: readonly PermissionAction[] = PERMISSION_ACTIONS;

    expect(actions).toEqual([
      'read',
      'create',
      'update',
      'delete',
      'execute',
      'manage',
    ]);
  });

  it('validates only canonical actions', () => {
    const map: PermissionActionMap = {
      execute: true,
      read: true,
    };

    expect(map.execute).toBe(true);
    expect(isPermissionAction('manage')).toBe(true);
    expect(isPermissionAction('write')).toBe(false);
    expect(isPermissionAction(null)).toBe(false);
  });
});
