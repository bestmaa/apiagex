import type { SetCustomApiPermissionInput } from "@apiagex/database";

export type CustomApiPermissionParams = {
  roleId: string;
};

export type CustomApiPermissionsBody = {
  permissions: Array<Omit<SetCustomApiPermissionInput, "roleId">>;
};

export type CustomApiRouteParams = {
  routeId: string;
};

export type CustomApiRouteMetadataBody = {
  groupName: string;
  name: string;
};
