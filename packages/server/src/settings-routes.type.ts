import type { AdminPermissionAction } from "@apiagex/database";

export type AdminRoleBody = {
  name: string;
  description?: string;
};

export type AdminRoleParams = {
  roleId: string;
};

export type AdminRolePermissionsBody = {
  permissions: Array<{
    action: AdminPermissionAction;
    allowed: boolean;
  }>;
};

export type ApiDocsSettingsBody = {
  adminEnabled: boolean;
  contentEnabled: boolean;
};
