import type { SchemaRecord } from "./schema.type";

export type PermissionAction = "getAll" | "get" | "create" | "update" | "delete" | "realtime" | "manage";

export type RoleKind = "admin" | "api";

export type RoleRecord = {
  id: string;
  name: string;
  description: string;
  isOwner: boolean;
  roleKind: RoleKind;
};

export type PermissionRecord = {
  id: string;
  roleId: string;
  schemaId: string;
  action: PermissionAction;
  allowed: boolean;
};

export type ApiTokenRecord = {
  id: string;
  roleId: string;
  roleName: string;
  name: string;
  tokenPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
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

export type ApiTokenListResponse = {
  ok: boolean;
  tokens?: ApiTokenRecord[];
  error?: string;
};

export type ApiTokenCreateResponse = {
  ok: boolean;
  token?: string;
  tokenRecord?: ApiTokenRecord;
  error?: string;
};

export type ApiTokenRevokeResponse = {
  ok: boolean;
  token?: ApiTokenRecord;
  error?: string;
};
