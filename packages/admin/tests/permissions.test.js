import { describe, expect, it } from 'vitest';

import { canAccess } from '../src/public/permissions.js';

describe('admin permissions', () => {
  it('allows media access for admin and editor roles', () => {
    expect(canAccess('owner', 'media-files', 'read')).toBe(true);
    expect(canAccess('owner', 'media-files', 'write')).toBe(true);
    expect(canAccess('admin', 'media-files', 'read')).toBe(true);
    expect(canAccess('admin', 'media-files', 'write')).toBe(true);
    expect(canAccess('editor', 'media-files', 'read')).toBe(true);
    expect(canAccess('editor', 'media-files', 'write')).toBe(true);
  });

  it('fails closed for unknown scopes', () => {
    expect(canAccess('admin', 'unknown-scope', 'read')).toBe(false);
  });
});
