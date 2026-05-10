export type ApiTokenRecord = {
  id: string;
  roleId: string;
  roleName: string;
  name: string;
  tokenPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
};

export type CreateApiTokenInput = {
  roleId: string;
  name?: string | undefined;
};

export type CreatedApiToken = {
  token: string;
  tokenRecord: ApiTokenRecord;
};
