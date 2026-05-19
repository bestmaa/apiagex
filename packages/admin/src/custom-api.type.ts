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

export type CustomApiRouteListResponse = {
  ok: boolean;
  routes?: CustomApiRouteRecord[];
  error?: string;
};

export type CustomApiPermissionRecord = {
  id: string;
  roleId: string;
  customApiRouteId: string;
  allowed: boolean;
};

export type CustomApiPermissionDraft = {
  customApiRouteId: string;
  allowed: boolean;
};

export type CustomApiPermissionListResponse = {
  ok: boolean;
  permissions?: CustomApiPermissionRecord[];
  error?: string;
};
