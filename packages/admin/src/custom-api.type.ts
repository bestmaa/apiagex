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

export type CustomApiRouteMutationResponse = {
  ok: boolean;
  route?: CustomApiRouteRecord;
  error?: string;
};

export type CustomApiRouteDeleteResponse = {
  ok: boolean;
  deleted?: boolean;
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

export type CustomApiPermissionEventRecord = {
  id: string;
  roleId: string;
  customApiRouteId: string;
  allowed: boolean;
  actorId: string;
  actorEmail: string;
  createdAt: string;
};

export type CustomApiPermissionHistoryResponse = {
  ok: boolean;
  events?: CustomApiPermissionEventRecord[];
  error?: string;
};
