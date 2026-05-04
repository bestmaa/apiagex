import type { PermissionEvaluationInput } from './permission-evaluator.type.js';

export function canEvaluatePermission(input: PermissionEvaluationInput): boolean {
  if (input.role === 'owner') {
    return true;
  }

  const scopedActions = input.permissions?.[input.scope];
  const explicitValue = scopedActions?.[input.action];

  if (typeof explicitValue === 'boolean') {
    return explicitValue;
  }

  return input.fallbackPermissions?.[input.scope]?.[input.action] === true;
}
