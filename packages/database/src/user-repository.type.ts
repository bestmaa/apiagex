export type CreateUserInput = {
  email: string;
  passwordHash: string;
  roleId: string;
  roleKind?: "admin" | "api";
};

export type UserRecord = {
  id: string;
  email: string;
  roleId: string;
  roleName: string;
  roleKind: "admin" | "api";
  createdAt: string;
  updatedAt: string;
};
