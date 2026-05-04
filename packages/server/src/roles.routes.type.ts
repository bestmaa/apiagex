import type { AdminAuthService } from './auth.type.js';
import type { RolesRepository } from './roles.repository.type.js';

export type RolePermissions = Record<string, Record<string, boolean>>;

export interface RoleInput {
  description?: string;
  id: string;
  name: string;
  permissions?: RolePermissions;
}

export interface RoleRecord {
  description: string;
  id: string;
  name: string;
  permissions: RolePermissions;
}

export interface RegisterRolesRoutesOptions {
  auth: AdminAuthService;
  repository: RolesRepository;
}
