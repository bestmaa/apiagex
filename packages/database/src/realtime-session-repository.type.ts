export type RealtimeSessionRecord = {
  id: string;
  tokenPrefix: string;
  roleId: string;
  schemaId: string;
  schemaSlug: string;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
};

export type CreatedRealtimeSession = {
  token: string;
  session: RealtimeSessionRecord;
};

export type CreateRealtimeSessionInput = {
  roleId: string;
  schemaId: string;
  schemaSlug: string;
  ttlSeconds?: number;
};
