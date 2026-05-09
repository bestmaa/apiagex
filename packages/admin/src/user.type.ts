export type UserRecord = {
  id: string;
  email: string;
  roleId: string;
  roleName: string;
  roleKind: "api";
};

export type UserListResponse = {
  ok: boolean;
  users?: UserRecord[];
  error?: string;
};

export type UserMutationResponse = {
  ok: boolean;
  user?: UserRecord;
  error?: string;
};
