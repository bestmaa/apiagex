import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildServer } from '../src/app.js';
import { bearerHeaders, loginAdmin } from './auth-test-utils.js';

describe('content fields relation targets', () => {
  it('rejects relation fields with missing targets', async () => {
    const databaseFile = join(await mkdtemp(join(tmpdir(), 'apiagex-fields-')), 'content-types.db');
    const app = await buildServer({ contentTypesDatabaseFile: databaseFile, logger: false });
    const token = await loginAdmin(app);

    await app.inject({
      headers: bearerHeaders(token),
      method: 'POST',
      url: '/admin/content-types',
      payload: {
        displayName: 'Article',
        fields: [],
        kind: 'collection',
        slug: 'articles',
      },
    });

    const response = await app.inject({
      headers: bearerHeaders(token),
      method: 'POST',
      url: '/admin/content-types/articles/fields',
      payload: {
        key: 'author',
        label: 'Author',
        required: false,
        repeatable: false,
        settings: {
          targetContentTypeId: 'missing',
        },
        sortOrder: 0,
        type: 'relation',
      },
    });

    await app.close();

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      message: 'Invalid relation target',
    });
  });
});
