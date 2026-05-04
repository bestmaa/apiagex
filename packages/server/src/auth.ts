import {
  createHmac,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto';

import type {
  AdminAuthService,
  AdminSession,
  AdminSessionPayload,
  AdminRole,
  PreviewTokenInput,
  PreviewTokenPayload,
  ServerAuthConfig,
} from './auth.type.js';

const SESSION_TTL_SECONDS = 60 * 60 * 12;
const PREVIEW_TTL_SECONDS = 60 * 15;

export function createAdminAuthService(config: ServerAuthConfig): AdminAuthService {
  const accounts = [
    createOptionalAccount(config.ownerEmail, config.ownerPassword, config.authSecret, 'owner'),
    createAccount(config.adminEmail, config.adminPassword, config.authSecret, 'admin'),
    createOptionalAccount(config.editorEmail, config.editorPassword, config.authSecret, 'editor'),
    createOptionalAccount(config.viewerEmail, config.viewerPassword, config.authSecret, 'viewer'),
  ].filter(Boolean) as Array<{
    email: string;
    passwordHash: Buffer;
    role: AdminRole;
  }>;

  return {
    createPreviewToken(input: PreviewTokenInput): string {
      return createPreviewSession(input, config.authSecret);
    },
    login(email: string, password: string): AdminSession | null {
      const normalizedEmail = normalizeEmail(email);
      const account = accounts.find((item) => item.email === normalizedEmail);

      if (!account) {
        return null;
      }

      const passwordHash = hashPassword(normalizedEmail, password, config.authSecret);

      if (!safeEqual(account.passwordHash, passwordHash)) {
        return null;
      }

      return createSession(normalizedEmail, config.authSecret, account.role);
    },
    verifyToken(token: string): AdminSessionPayload | null {
      return verifySessionToken(token, config.authSecret);
    },
    verifyPreviewToken(token: string): PreviewTokenPayload | null {
      return verifyPreviewSessionToken(token, config.authSecret);
    },
  };
}

export function createSignedSessionToken(input: {
  authSecret: string;
  email: string;
  expiresInSeconds?: number;
  role: string;
}): string {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + (input.expiresInSeconds ?? SESSION_TTL_SECONDS);
  const payload = {
    email: input.email,
    exp,
    iat,
    role: input.role,
    sub: input.email,
  };

  return signPayload(payload, input.authSecret);
}

export function getBearerToken(authorizationHeader: string | undefined): string | null {
  if (!authorizationHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authorizationHeader.slice('Bearer '.length).trim();

  return token.length > 0 ? token : null;
}

export function requireAdminToken(
  auth: AdminAuthService,
  authorizationHeader: string | undefined,
): AdminSessionPayload | null {
  const token = getBearerToken(authorizationHeader);

  if (!token) {
    return null;
  }

  return auth.verifyToken(token);
}

function createSession(email: string, secret: string, role: AdminRole): AdminSession {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + SESSION_TTL_SECONDS;
  const payload: AdminSessionPayload = {
    email,
    exp,
    iat,
    role,
    sub: email,
  };

  return {
    expiresAt: exp * 1000,
    token: signPayload(payload, secret),
    user: {
      email,
      role,
    },
  };
}

function createPreviewSession(input: PreviewTokenInput, secret: string): string {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + PREVIEW_TTL_SECONDS;
  const payload: PreviewTokenPayload = {
    contentTypeId: input.contentTypeId,
    email: 'preview@apiagex.local',
    exp,
    iat,
    kind: 'preview',
    sub: input.contentTypeId,
  };

  if (typeof input.entryId === 'string' && input.entryId) {
    payload.entryId = input.entryId;
  }

  return signPayload(payload, secret);
}

function createAccount(
  email: string,
  password: string,
  secret: string,
  role: AdminRole,
): {
  email: string;
  passwordHash: Buffer;
  role: AdminRole;
} {
  const normalizedEmail = normalizeEmail(email);

  return {
    email: normalizedEmail,
    passwordHash: hashPassword(normalizedEmail, password, secret),
    role,
  };
}

function createOptionalAccount(
  email: string | undefined,
  password: string | undefined,
  secret: string,
  role: AdminRole,
): {
  email: string;
  passwordHash: Buffer;
  role: AdminRole;
} | null {
  if (!email || !password) {
    return null;
  }

  return createAccount(email, password, secret, role);
}

function verifySessionToken(token: string, secret: string): AdminSessionPayload | null {
  const parts = token.split('.');

  if (parts.length !== 3) {
    return null;
  }

  const [headerPart, payloadPart, signaturePart] = parts as [string, string, string];
  const expectedSignature = sign(`${headerPart}.${payloadPart}`, secret);

  if (!safeEqualBuffer(base64UrlDecode(signaturePart), base64UrlDecode(expectedSignature))) {
    return null;
  }

  const payload = parseJson<AdminSessionPayload>(base64UrlDecode(payloadPart).toString('utf8'));

  if (!payload || payload.exp <= Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
}

function verifyPreviewSessionToken(token: string, secret: string): PreviewTokenPayload | null {
  const parts = token.split('.');

  if (parts.length !== 3) {
    return null;
  }

  const [headerPart, payloadPart, signaturePart] = parts as [string, string, string];
  const expectedSignature = sign(`${headerPart}.${payloadPart}`, secret);

  if (!safeEqualBuffer(base64UrlDecode(signaturePart), base64UrlDecode(expectedSignature))) {
    return null;
  }

  const payload = parseJson<PreviewTokenPayload>(base64UrlDecode(payloadPart).toString('utf8'));

  if (!payload || payload.kind !== 'preview' || payload.exp <= Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
}

function signPayload(payload: object, secret: string): string {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(`${header}.${body}`, secret);

  return `${header}.${body}.${signature}`;
}

function sign(input: string, secret: string): string {
  return base64UrlEncode(createHmac('sha256', secret).update(input).digest());
}

function hashPassword(email: string, password: string, secret: string): Buffer {
  return scryptSync(password, `${secret}:${email}`, 64);
}

function safeEqual(left: Buffer, right: Buffer): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

function safeEqualBuffer(left: Buffer, right: Buffer): boolean {
  return safeEqual(left, right);
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function base64UrlEncode(value: string | Buffer): string {
  return Buffer.from(value)
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

function base64UrlDecode(value: string): Buffer {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));

  return Buffer.from(`${normalized}${padding}`, 'base64');
}

function parseJson<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}
