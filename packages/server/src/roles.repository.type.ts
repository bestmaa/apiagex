import type { RoleInput, RoleRecord } from './roles.routes.type.js';

export interface RoleRow {
  built_in: number;
  created_at: string;
  description: string;
  id: string;
  name: string;
  permissions_json: string;
  updated_at: string;
}

export interface RolesRepository {
  clear(): void;
  close(): void;
  create(input: RoleInput): RoleRecord;
  delete(id: string): boolean;
  get(id: string): RoleRecord | null;
  getByName(name: string): RoleRecord | null;
  isBuiltIn(id: string): boolean;
  list(): readonly RoleRecord[];
  replaceAll(records: readonly RoleRecord[]): void;
  update(id: string, input: RoleInput): RoleRecord | null;
}

export interface RolesRepositoryFactory {
  create(databaseFile: string): RolesRepository;
}
