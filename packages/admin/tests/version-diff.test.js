import { describe, expect, it } from 'vitest';

import { buildVersionComparison } from '../src/public/entries-versions-diff.js';

describe('buildVersionComparison', () => {
  it('summarizes the changed fields between snapshots', () => {
    const rows = buildVersionComparison(
      [
        { key: 'title', label: 'Title', repeatable: false },
        { key: 'tags', label: 'Tags', repeatable: true },
      ],
      {
        data: { tags: ['alpha', 'beta'], title: 'Draft title' },
        publishAt: '2026-04-30T00:00:00.000Z',
        status: 'published',
      },
      {
        data: { tags: ['alpha'], title: 'Older title' },
        publishAt: null,
        status: 'draft',
      },
    );

    expect(rows).toEqual([
      { current: 'published', key: 'status', label: 'Status', version: 'draft' },
      { current: '2026-04-30T00:00:00.000Z', key: 'publishAt', label: 'Publish at', version: '—' },
      { current: 'Draft title', label: 'Title', version: 'Older title' },
      { current: 'alpha, beta', label: 'Tags', version: 'alpha' },
    ]);
  });
});
