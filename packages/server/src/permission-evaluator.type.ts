import type { PermissionAction, PermissionActionMap } from './permission-actions.type.js';

export type PermissionCatalog = Record<string, PermissionActionMap>;

export interface PermissionEvaluationInput {
  action: PermissionAction;
  fallbackPermissions?: PermissionCatalog | null;
  permissions?: PermissionCatalog | null;
  role: string | null | undefined;
  scope: string;
}
