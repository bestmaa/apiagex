import { describe, expect, it } from 'vitest';

import { parseTypes } from '../src/realtime.routes.js';

describe('parseTypes', () => {
  it('reads the contentTypes query alias', () => {
    expect(parseTypes({ contentTypes: 'articles' })).toEqual(['articles']);
  });

  it('keeps the original types query compatible', () => {
    expect(parseTypes({ types: 'articles,posts' })).toEqual(['articles', 'posts']);
  });
});
