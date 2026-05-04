import type { CreateRoleInput } from "@apiagex/database";
import type { SetPermissionInput } from "@apiagex/database";

export type RoleBody = CreateRoleInput;

export type RoleParams = {
  roleId: string;
};

export type RolePermissionsBody = {
  permissions: Array<Omit<SetPermissionInput, "roleId">>;
};
