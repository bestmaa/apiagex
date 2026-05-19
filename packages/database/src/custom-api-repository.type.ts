export type CustomApiRouteRecord = {
  id: string;
  method: string;
  path: string;
  name: string;
  groupName: string;
  permissionKey: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  lastSeenAt: string;
};

export type SyncCustomApiRouteInput = {
  method: string;
  path: string;
  name: string;
  groupName: string;
  permissionKey: string;
};

export type CustomApiPermissionRecord = {
  id: string;
  roleId: string;
  customApiRouteId: string;
  allowed: boolean;
};

export type SetCustomApiPermissionInput = {
  roleId: string;
  customApiRouteId: string;
  allowed: boolean;
};
