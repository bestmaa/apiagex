export type CreateRoleInput = {
  name: string;
  description?: string;
};

export type RoleRecord = {
  id: string;
  name: string;
  description: string;
  isOwner: boolean;
  createdAt: string;
  updatedAt: string;
};
