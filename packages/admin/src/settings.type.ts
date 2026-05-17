import type { RoleRecord } from "./role.type";

export type AdminPermissionAction =
  | "schemas"
  | "entries"
  | "apiRoles"
  | "apiUsers"
  | "settings";

export type AdminPermissionRecord = {
  id: string;
  roleId: string;
  action: AdminPermissionAction;
  allowed: boolean;
};

export type AccessSettingsResponse = {
  ok: boolean;
  adminRoles?: RoleRecord[];
  apiRoles?: RoleRecord[];
  error?: string;
};

export type AdminPermissionListResponse = {
  ok: boolean;
  permissions?: AdminPermissionRecord[];
  error?: string;
};

export type AdminPermissionDraft = {
  action: AdminPermissionAction;
  allowed: boolean;
};

export type ApiDocsSettingsRecord = {
  adminEnabled: boolean;
  contentEnabled: boolean;
  updatedAt: string | null;
};

export type ApiDocsSettingsResponse = {
  ok: boolean;
  settings?: ApiDocsSettingsRecord;
  error?: string;
};
