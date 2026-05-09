import type { SchemaRecord } from "./schema.type";

export type PermissionAction = "getAll" | "get" | "create" | "update" | "delete" | "manage";

export type RoleRecord = {
  id: string;
  name: string;
  description: string;
  isOwner: boolean;
};

export type PermissionRecord = {
  id: string;
  roleId: string;
  schemaId: string;
  action: PermissionAction;
  allowed: boolean;
};

export type RoleListResponse = {
  ok: boolean;
  roles?: RoleRecord[];
  error?: string;
};

export type RoleMutationResponse = {
  ok: boolean;
  role?: RoleRecord;
  error?: string;
};

export type PermissionListResponse = {
  ok: boolean;
  permissions?: PermissionRecord[];
  error?: string;
};

export type PermissionDraft = {
  schemaId: SchemaRecord["id"];
  action: PermissionAction;
  allowed: boolean;
};
