import type { PermissionEvaluationInput } from './permission-evaluator.type.js';

export function canEvaluatePermission(input: PermissionEvaluationInput): boolean {
  if (input.role === 'owner') {
    return true;
  }

  const scopedActions = input.permissions?.[input.scope];

  if (!scopedActions) {
    return false;
  }

  return scopedActions[input.action] === true;
}
