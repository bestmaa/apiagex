import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const docsRoot = new URL('.', import.meta.url).pathname;

describe('permission scope docs', () => {
  it('defines the RBAC V2 scope domains and evaluation order', () => {
    const markdown = readFileSync(join(docsRoot, 'permission-scopes.md'), 'utf8');

    expect(markdown).toContain('system:roles');
    expect(markdown).toContain('tenant:<tenantId>');
    expect(markdown).toContain('content-types:<contentTypeId>');
    expect(markdown).toContain('api:<method>:<path>');
    expect(markdown).toContain('Legacy admin `write` checks');
    expect(markdown).toContain('default-deny');
    expect(markdown).toContain('fallback allow');
    expect(markdown).toContain('content role catalog checks');
    expect(markdown).toContain('Fastify routes');
    expect(markdown).toContain('Explicit `false`');
  });
});
