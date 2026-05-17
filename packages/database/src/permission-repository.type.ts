export type PermissionAction = "getAll" | "get" | "create" | "update" | "delete" | "realtime" | "manage";

export type SetPermissionInput = {
  roleId: string;
  schemaId: string;
  action: PermissionAction;
  allowed: boolean;
};

export type PermissionRecord = SetPermissionInput & {
  id: string;
};
