import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildServer } from '../src/app.js';
import { bearerHeaders, loginAdmin, loginEditor } from './auth-test-utils.js';

describe('audit routes', () => {
  it('records content type, field, and entry writes', async () => {
    const databaseFile = join(await mkdtemp(join(tmpdir(), 'apiagex-audit-')), 'content-types.db');
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
    await app.inject({
      headers: bearerHeaders(token),
      method: 'POST',
      url: '/admin/content-types/articles/fields',
      payload: {
        key: 'title',
        label: 'Title',
        required: true,
        repeatable: false,
        sortOrder: 0,
        type: 'text',
      },
    });
    await app.inject({
      headers: bearerHeaders(token),
      method: 'POST',
      url: '/admin/content-types/articles/entries',
      payload: {
        data: {
          title: 'Hello',
        },
        status: 'published',
      },
    });

    const response = await app.inject({
      headers: bearerHeaders(token),
      method: 'GET',
      url: '/admin/audit-logs',
    });

    await app.close();

    const body = response.json() as {
      items: Array<{ action: string; scope: string; subjectId: string }>;
    };

    expect(response.statusCode).toBe(200);
    expect(body.items).toHaveLength(3);
    expect(body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: 'create', scope: 'content-types', subjectId: 'articles' }),
        expect.objectContaining({ action: 'create', scope: 'content-fields', subjectId: 'articles:title' }),
        expect.objectContaining({ action: 'create', scope: 'content-entries' }),
      ]),
    );
  });

  it('rejects non-admin access to audit logs', async () => {
    const databaseFile = join(await mkdtemp(join(tmpdir(), 'apiagex-audit-')), 'content-types.db');
    const app = await buildServer({
      contentTypesDatabaseFile: databaseFile,
      editorEmail: 'editor@example.com',
      editorPassword: 'editor123',
      logger: false,
    });
    const token = await loginEditor(app);

    const response = await app.inject({
      headers: bearerHeaders(token),
      method: 'GET',
      url: '/admin/audit-logs',
    });

    await app.close();

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({
      message: 'Forbidden',
    });
  });
});
