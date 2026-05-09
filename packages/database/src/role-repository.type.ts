export type RoleKind = "admin" | "api";

export type CreateRoleInput = {
  name: string;
  description?: string;
};

export type RoleRecord = {
  id: string;
  name: string;
  description: string;
  isOwner: boolean;
  roleKind: RoleKind;
  createdAt: string;
  updatedAt: string;
};
