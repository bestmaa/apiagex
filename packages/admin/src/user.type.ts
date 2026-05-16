export type UserRecord = {
  id: string;
  email: string;
  roleId: string;
  roleName: string;
  roleKind: "admin" | "api";
};

export type UserListResponse = {
  ok: boolean;
  roles?: Array<{ id: string; isOwner?: boolean; name: string; roleKind: "admin" | "api" }>;
  users?: UserRecord[];
  error?: string;
};

export type UserMutationResponse = {
  ok: boolean;
  user?: UserRecord;
  error?: string;
};
