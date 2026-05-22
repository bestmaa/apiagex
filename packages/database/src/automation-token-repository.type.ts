export const AUTOMATION_TOKEN_SCOPES = [
  "schemas:manage",
  "workflows:manage",
  "permissions:manage",
  "routes:read",
  "plans:apply",
] as const;

export type AutomationTokenScope = typeof AUTOMATION_TOKEN_SCOPES[number];

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

export type CreateAutomationTokenInput = {
  name?: string | undefined;
  scopes?: AutomationTokenScope[] | undefined;
  ttlMinutes?: number | undefined;
  createdById?: string | undefined;
  createdByEmail?: string | undefined;
};

export type CreatedAutomationToken = {
  token: string;
  tokenRecord: AutomationTokenRecord;
};

export type ResolvedAutomationToken = {
  tokenRecord: AutomationTokenRecord;
};
