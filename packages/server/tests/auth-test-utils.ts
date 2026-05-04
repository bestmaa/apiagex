import { DEFAULT_ADMIN_PASSWORD, DEFAULT_AUTH_SECRET } from '../src/config.js';
import { createSignedSessionToken } from '../src/auth.js';
import type { ApiagexServer } from '../src/app.type.js';

export async function loginAdmin(app: ApiagexServer): Promise<string> {
  return loginWithCredentials(app, 'admin@example.com', DEFAULT_ADMIN_PASSWORD);
}

export async function loginEditor(app: ApiagexServer): Promise<string> {
  return loginWithCredentials(app, 'editor@example.com', 'editor123');
}

export async function loginViewer(app: ApiagexServer): Promise<string> {
  return loginWithCredentials(app, 'viewer@example.com', 'viewer123');
}

export async function loginWithCredentials(
  app: ApiagexServer,
  email: string,
  password: string,
): Promise<string> {
  const response = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: {
      email,
      password,
    },
  });

  if (response.statusCode !== 200) {
    throw new Error(`Login failed with ${response.statusCode}: ${response.body}`);
  }

  const body = response.json() as { token?: string };
  if (!body.token) {
    throw new Error('Login response did not include a token');
  }

  return body.token;
}

export function bearerHeaders(token: string): { authorization: string } {
  return {
    authorization: `Bearer ${token}`,
  };
}

export function createRoleToken(role: string, options?: { authSecret?: string; email?: string }): string {
  return createSignedSessionToken({
    authSecret: options?.authSecret ?? DEFAULT_AUTH_SECRET,
    email: options?.email ?? `${role}@example.com`,
    role,
  });
}
