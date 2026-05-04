export type PermissionAction = "read" | "create" | "update" | "delete" | "manage";

export type SetPermissionInput = {
  roleId: string;
  schemaId: string;
  action: PermissionAction;
  allowed: boolean;
};

export type PermissionRecord = SetPermissionInput & {
  id: string;
};
