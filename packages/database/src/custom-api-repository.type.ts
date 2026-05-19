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

export type UpdateCustomApiRouteMetadataInput = {
  id: string;
  groupName: string;
  name: string;
};

export type CustomApiPermissionEventRecord = {
  id: string;
  roleId: string;
  customApiRouteId: string;
  allowed: boolean;
  actorId: string;
  actorEmail: string;
  createdAt: string;
};

export type RecordCustomApiPermissionEventInput = {
  roleId: string;
  customApiRouteId: string;
  allowed: boolean;
  actorId: string;
  actorEmail: string;
};
