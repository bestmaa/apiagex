import type { ServerConfig } from './config.type.js';

export const DEFAULT_ADMIN_EMAIL = 'admin@example.com';
export const DEFAULT_ADMIN_PASSWORD = 'change-me-in-production';
export const DEFAULT_AUTH_SECRET = 'change-me-in-production-auth-secret';
export const DEFAULT_HOST = '0.0.0.0';
export const LOCAL_DEV_OWNER_EMAIL = 'owner@apiagex.local';
export const LOCAL_DEV_OWNER_PASSWORD = 'OwnerPass123!';
export const DEFAULT_PORT = 4000;

export function readServerConfig(source: NodeJS.ProcessEnv = process.env): ServerConfig {
  const errors: string[] = [];
  const adminEmail = readEmail(source.ADMIN_EMAIL, DEFAULT_ADMIN_EMAIL, 'ADMIN_EMAIL', errors);
  const adminPassword = readText(source.ADMIN_PASSWORD, DEFAULT_ADMIN_PASSWORD, 'ADMIN_PASSWORD', errors);
  const authSecret = readText(source.AUTH_SECRET, DEFAULT_AUTH_SECRET, 'AUTH_SECRET', errors);
  const host = readText(source.HOST, DEFAULT_HOST, 'HOST', errors);
  const port = readPort(source.PORT, DEFAULT_PORT, errors);
  const owner = readOwnerAccount(source, errors);
  const editor = readOptionalAccount(source.EDITOR_EMAIL, source.EDITOR_PASSWORD, 'EDITOR', errors);
  const viewer = readOptionalAccount(source.VIEWER_EMAIL, source.VIEWER_PASSWORD, 'VIEWER', errors);

  if (isProduction(source) && typeof source.ADMIN_PASSWORD === 'undefined') {
    errors.push('ADMIN_PASSWORD must be set in production.');
  }

  if (isProduction(source) && typeof source.AUTH_SECRET === 'undefined') {
    errors.push('AUTH_SECRET must be set in production.');
  }

  if (errors.length > 0) {
    throw new Error(`Invalid server config:\n- ${errors.join('\n- ')}`);
  }

  return {
    adminEmail,
    adminPassword,
    authSecret,
    host,
    port,
    ...owner,
    ...editor,
    ...viewer,
  };
}

function isProduction(source: NodeJS.ProcessEnv): boolean {
  return source.NODE_ENV === 'production';
}

function readOwnerAccount(source: NodeJS.ProcessEnv, errors: string[]): Partial<ServerConfig> {
  if (source.APIAGEX_LOCAL_OWNER === 'true') {
    if (isProduction(source)) {
      errors.push('APIAGEX_LOCAL_OWNER cannot be enabled in production.');
      return {};
    }

    return {
      ownerEmail: source.OWNER_EMAIL?.trim() || LOCAL_DEV_OWNER_EMAIL,
      ownerPassword: source.OWNER_PASSWORD?.trim() || LOCAL_DEV_OWNER_PASSWORD,
    };
  }

  return readOptionalAccount(source.OWNER_EMAIL, source.OWNER_PASSWORD, 'OWNER', errors);
}

function readOptionalAccount(
  email: string | undefined,
  password: string | undefined,
  label: string,
  errors: string[],
): Partial<ServerConfig> {
  if (typeof email === 'undefined' && typeof password === 'undefined') {
    return {};
  }

  if (!isNonEmptyText(email) || !isNonEmptyText(password)) {
    errors.push(`${label}_EMAIL and ${label}_PASSWORD must be set together.`);
    return {};
  }

  if (!isEmail(email)) {
    errors.push(`${label}_EMAIL must be a valid email address.`);
  }

  return {
    [`${label.toLowerCase()}Email`]: email.trim(),
    [`${label.toLowerCase()}Password`]: password.trim(),
  } as Partial<ServerConfig>;
}

function readPort(value: string | undefined, fallback: number, errors: string[]): number {
  if (typeof value === 'undefined') {
    return fallback;
  }

  const parsed = Number.parseInt(value.trim(), 10);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    errors.push('PORT must be a whole number between 1 and 65535.');
    return fallback;
  }

  return parsed;
}

function readText(value: string | undefined, fallback: string, name: string, errors: string[]): string {
  if (typeof value === 'undefined') {
    return fallback;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    errors.push(`${name} cannot be empty.`);
    return fallback;
  }

  return trimmed;
}

function readEmail(value: string | undefined, fallback: string, name: string, errors: string[]): string {
  const email = readText(value, fallback, name, errors);

  if (!isEmail(email)) {
    errors.push(`${name} must be a valid email address.`);
  }

  return email;
}

function isNonEmptyText(value: string | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
