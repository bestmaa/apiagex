export type AdminRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface ServerAuthConfig {
  ownerEmail?: string;
  ownerPassword?: string;
  adminEmail: string;
  adminPassword: string;
  authSecret: string;
  editorEmail?: string;
  editorPassword?: string;
  viewerEmail?: string;
  viewerPassword?: string;
}

export interface AdminSession {
  expiresAt: number;
  token: string;
  user: {
    email: string;
    role: AdminRole;
  };
}

export interface AdminSessionPayload {
  email: string;
  exp: number;
  iat: number;
  role: AdminRole;
  sub: string;
}

export interface PreviewTokenInput {
  contentTypeId: string;
  entryId?: string;
}

export interface PreviewTokenPayload {
  contentTypeId: string;
  email: string;
  entryId?: string;
  exp: number;
  iat: number;
  kind: 'preview';
  sub: string;
}

export interface AdminAuthService {
  login(email: string, password: string): AdminSession | null;
  createPreviewToken(input: PreviewTokenInput): string;
  verifyToken(token: string): AdminSessionPayload | null;
  verifyPreviewToken(token: string): PreviewTokenPayload | null;
}
