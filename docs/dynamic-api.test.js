import { describe, expect, it } from 'vitest';

import { buildDynamicApiMarkdownSections } from './dynamic-api.js';

describe('buildDynamicApiMarkdownSections', () => {
  it('renders endpoint and settings docs for content types', () => {
    const sections = buildDynamicApiMarkdownSections([
      {
        displayName: 'Articles',
        fieldCount: 3,
        kind: 'collection',
        permissions: {
          create: ['admin', 'editor'],
          delete: ['admin'],
          list: ['admin', 'editor', 'viewer'],
          read: ['admin', 'editor', 'viewer'],
          update: ['admin'],
        },
        realtimeActions: { create: true, delete: false, update: true },
        realtimeEnabled: true,
        slug: 'articles',
      },
    ]);

    expect(sections.en).toContain('Articles `articles`');
    expect(sections.en).toContain('GET /api/articles');
    expect(sections.en).toContain('GET /api/articles/:entryId');
    expect(sections.en).toContain('POST /admin/content-types/articles/entries');
    expect(sections.en).toContain('Create: admin, editor');
    expect(sections.en).toContain('Webhook filter example');
    expect(sections.en).toContain('"contentTypeIds": [');
    expect(sections.en).toContain('master: enabled');
    expect(sections.en).toContain('actions: create, update');
    expect(sections.en).toContain('Webhook filters can target this content type');

    expect(sections.hi).toContain('Articles `articles`');
    expect(sections.hi).toContain('GET /api/articles');
    expect(sections.hi).toContain('GET /api/articles/:entryId');
    expect(sections.hi).toContain('POST /admin/content-types/articles/entries');
    expect(sections.hi).toContain('Webhook filter example');
    expect(sections.hi).toContain('master: enabled');
  });
});
