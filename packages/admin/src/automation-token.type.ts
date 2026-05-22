export const automationTokenScopes = [
  "schemas:manage",
  "workflows:manage",
  "permissions:manage",
  "routes:read",
  "plans:apply",
] as const;

export type AutomationTokenScope = typeof automationTokenScopes[number];

export type AutomationTokenRecord = {
  id: string;
  name: string;
  tokenPrefix: string;
  scopes: AutomationTokenScope[];
  createdAt: string;
  expiresAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdById: string | null;
  createdByEmail: string | null;
};

export type AutomationTokenListResponse = {
  ok: boolean;
  tokens?: AutomationTokenRecord[];
  error?: string;
};

export type AutomationTokenCreateResponse = {
  ok: boolean;
  projectEnv?: {
    ok: boolean;
    path?: string;
    error?: string;
  };
  token?: string;
  tokenRecord?: AutomationTokenRecord;
  error?: string;
};

export type AutomationTokenRevokeResponse = {
  ok: boolean;
  token?: AutomationTokenRecord;
  error?: string;
};
