import type { PermissionAction } from './permission-actions.type.js';

export const PERMISSION_ACTIONS = [
  'read',
  'create',
  'update',
  'delete',
  'execute',
  'manage',
] as const satisfies readonly PermissionAction[];

const PERMISSION_ACTION_SET = new Set<string>(PERMISSION_ACTIONS);

export function isPermissionAction(value: unknown): value is PermissionAction {
  return typeof value === 'string' && PERMISSION_ACTION_SET.has(value);
}
