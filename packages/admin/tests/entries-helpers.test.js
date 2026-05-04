import { afterEach, describe, expect, it, vi } from 'vitest';

import { syncPublishAtState } from '../src/public/entries-helpers.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('entry helper controls', () => {
  it('enables publish date only for scheduled entries', () => {
    vi.stubGlobal('window', {
      localStorage: {
        getItem: () => JSON.stringify({ role: 'admin', token: 'token' }),
      },
    });

    const status = { value: 'scheduled' };
    const publishAt = { disabled: true, required: false };

    syncPublishAtState(status, publishAt);

    expect(publishAt.disabled).toBe(false);
    expect(publishAt.required).toBe(true);
  });
});
