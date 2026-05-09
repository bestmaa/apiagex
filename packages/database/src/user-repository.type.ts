export type CreateUserInput = {
  email: string;
  passwordHash: string;
  roleId: string;
};

export type UserRecord = {
  id: string;
  email: string;
  roleId: string;
  roleName: string;
  roleKind: "api";
  createdAt: string;
  updatedAt: string;
};
