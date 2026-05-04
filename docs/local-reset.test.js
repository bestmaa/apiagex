import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const docsRoot = new URL('.', import.meta.url).pathname;

describe('local reset docs', () => {
  it('documents dry-run, apply, and local owner credentials', () => {
    const markdown = readFileSync(join(docsRoot, 'local-reset.md'), 'utf8');

    expect(markdown).toContain('npm run reset:local');
    expect(markdown).toContain('npm run reset:local -- --apply');
    expect(markdown).toContain('APIAGEX_LOCAL_OWNER=true');
    expect(markdown).toContain('owner@apiagex.local');
    expect(markdown).toContain('OwnerPass123!');
  });
});
