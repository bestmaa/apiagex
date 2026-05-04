import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const doc = readFileSync(new URL('./manual-verification.md', import.meta.url), 'utf8');
const script = readFileSync(new URL('../scripts/manual-webhook-server.mjs', import.meta.url), 'utf8');

describe('manual verification guide', () => {
  it('includes the repeatable browser workflow and helper listener', () => {
    expect(doc).toContain('npm run dev -w @apiagex/server');
    expect(doc).toContain('npm run dev -w @apiagex/admin');
    expect(doc).toContain('node scripts/manual-webhook-server.mjs');
    expect(doc).toContain('admin@example.com');
    expect(doc).toContain('change-me-in-production');
    expect(doc).toContain('#/schema');
    expect(doc).toContain('#/entries');
    expect(doc).toContain('#/realtime');
    expect(doc).toContain('#/roles');
    expect(doc).toContain('#/webhooks');
    expect(doc).toContain('#/docs');
    expect(doc).toContain('http://127.0.0.1:8787/hook');
    expect(script).toContain('Manual webhook listener running at');
    expect(script).toContain('127.0.0.1');
  });
});
