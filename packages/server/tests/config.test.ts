import { describe, expect, it } from 'vitest';

import {
  DEFAULT_ADMIN_EMAIL,
  DEFAULT_ADMIN_PASSWORD,
  DEFAULT_AUTH_SECRET,
  DEFAULT_HOST,
  DEFAULT_PORT,
  readServerConfig,
} from '../src/config.js';

describe('readServerConfig', () => {
  it('uses safe defaults in development mode', () => {
    const config = readServerConfig({});

    expect(config).toMatchObject({
      adminEmail: DEFAULT_ADMIN_EMAIL,
      adminPassword: DEFAULT_ADMIN_PASSWORD,
      authSecret: DEFAULT_AUTH_SECRET,
      host: DEFAULT_HOST,
      port: DEFAULT_PORT,
    });
  });

  it('rejects invalid ports and malformed account env values', () => {
    expect(() =>
      readServerConfig({
        ADMIN_EMAIL: 'admin@example.com',
        ADMIN_PASSWORD: 'valid-password',
        AUTH_SECRET: 'valid-secret',
        EDITOR_EMAIL: 'not-an-email',
        EDITOR_PASSWORD: 'editor123',
        PORT: '70000',
      }),
    ).toThrowError(/PORT must be a whole number between 1 and 65535/);
  });

  it('rejects production startup when admin password or auth secret are missing', () => {
    expect(() =>
      readServerConfig({
        ADMIN_EMAIL: 'admin@example.com',
        NODE_ENV: 'production',
      }),
    ).toThrowError(/ADMIN_PASSWORD must be set in production/);
  });

  it('blocks local owner mode in production', () => {
    expect(() =>
      readServerConfig({
        ADMIN_EMAIL: 'admin@example.com',
        ADMIN_PASSWORD: 'valid-password',
        APIAGEX_LOCAL_OWNER: 'true',
        AUTH_SECRET: 'valid-secret',
        NODE_ENV: 'production',
      }),
    ).toThrowError(/APIAGEX_LOCAL_OWNER cannot be enabled in production/);
  });
});
