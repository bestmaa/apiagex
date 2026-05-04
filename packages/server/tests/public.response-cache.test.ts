import { describe, expect, it } from 'vitest';

import { createPublicResponseCache } from '../src/content-public.cache.js';
import { DEFAULT_CONTENT_TYPE_PERMISSIONS } from '../src/content-type-permissions.js';
import { registerContentPublicRoutes } from '../src/content-public.routes.js';
import type { ContentPublicRouteOptions, PublicEntryRecord } from '../src/content-public.routes.type.js';
import fastify from 'fastify';

describe('public response cache', () => {
  it('returns cached public responses until invalidated', async () => {
    let fieldCalls = 0;
    let listCalls = 0;
    let typeCalls = 0;

    const contentEntry: PublicEntryRecord = {
      data: { title: 'Cached article' },
      id: 'article-1',
    };

    const options: ContentPublicRouteOptions = {
      contentEntriesRepository: {
        list(contentTypeId: string) {
          listCalls += 1;
          if (contentTypeId !== 'articles') {
            return [];
          }

          return [
            {
              contentTypeId: 'articles',
              data: contentEntry.data,
              id: contentEntry.id,
              publishAt: null,
              status: 'published' as const,
            },
          ];
        },
      },
      contentTypesRepository: {
        get(id: string) {
          typeCalls += 1;
          return id === 'articles'
            ? {
                id,
                kind: 'collection' as const,
              realtimeActions: { create: false, delete: false, update: false },
              realtimeEnabled: false,
              permissions: DEFAULT_CONTENT_TYPE_PERMISSIONS,
              slug: id,
            }
            : null;
        },
        listFields() {
          fieldCalls += 1;
          return [
            {
              key: 'title',
              label: 'Title',
              repeatable: false,
              required: true,
              settings: {},
              type: 'text' as const,
            },
          ];
        },
      },
      previewAuth: {
        verifyPreviewToken() {
          return null;
        },
      },
      rolesRepository: {
        get() {
          return null;
        },
        getByName() {
          return null;
        },
      },
      responseCache: createPublicResponseCache(10_000),
    };

    const app = fastify({ logger: false });
    await registerContentPublicRoutes(app, options);

    const first = await app.inject({ method: 'GET', url: '/api/articles' });
    const second = await app.inject({ method: 'GET', url: '/api/articles' });

    await app.close();

    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(200);
    expect(first.json()).toMatchObject({
      items: [
        {
          data: { title: 'Cached article' },
        },
      ],
      status: 'ok',
    });
    expect(second.json()).toMatchObject(first.json());
    expect(typeCalls).toBe(4);
    expect(listCalls).toBe(1);
    expect(fieldCalls).toBe(1);
  });

  it('expires cached entries after ttl', async () => {
    const cache = createPublicResponseCache(1);

    cache.set('key', { value: 1 });
    expect(cache.get<{ value: number }>('key')).toEqual({ value: 1 });

    await new Promise((resolve) => setTimeout(resolve, 5));

    expect(cache.get('key')).toBeNull();
  });
});
