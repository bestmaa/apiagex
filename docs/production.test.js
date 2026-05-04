import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const doc = readFileSync(new URL('./production.md', import.meta.url), 'utf8');

describe('production hardening doc', () => {
  it('covers startup, health, request ids, and safe defaults in both languages', () => {
    expect(doc).toContain('Environment validation');
    expect(doc).toContain('Startup errors');
    expect(doc).toContain('Health checks');
    expect(doc).toContain('Safe defaults');
    expect(doc).toContain('x-request-id');
    expect(doc).toContain('`GET /health/detail`');
    expect(doc).toContain('`ADMIN_PASSWORD`');
    expect(doc).toContain('`AUTH_SECRET`');
    expect(doc).toContain('Environment validation');
    expect(doc).toContain('Production deployment ko ready');
  });
});
