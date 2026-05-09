export type AdminPermissionAction =
  | "schemas"
  | "entries"
  | "apiRoles"
  | "apiUsers"
  | "settings";

export type SetAdminPermissionInput = {
  roleId: string;
  action: AdminPermissionAction;
  allowed: boolean;
};

export type AdminPermissionRecord = SetAdminPermissionInput & {
  id: string;
};
