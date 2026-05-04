import { describe, expect, it } from 'vitest';

import { createRealtimeStreamManager } from '../src/realtime.service.js';

describe('realtime stream manager', () => {
  it('publishes create events when create is enabled and update/delete are disabled', () => {
    const manager = createRealtimeStreamManager();
    const chunks: string[] = [];
    const contentTypes = createContentTypes({
      articles: {
        realtimeActions: { create: true, delete: false, update: false },
        realtimeEnabled: true,
      },
    });

    manager.connect(['articles'], (chunk) => {
      chunks.push(chunk);
    });

    manager.publish(createEvent('create'), contentTypes);
    manager.publish(createEvent('update'), contentTypes);
    manager.publish(createEvent('delete'), contentTypes);

    expect(chunks.filter((chunk) => chunk.includes('event: update'))).toHaveLength(1);
    expect(chunks.some((chunk) => chunk.includes('"contentTypeSlug":"articles"'))).toBe(true);
  });

  it('publishes update events when update is enabled only', () => {
    const manager = createRealtimeStreamManager();
    const chunks: string[] = [];
    const contentTypes = createContentTypes({
      articles: {
        realtimeActions: { create: false, delete: false, update: true },
        realtimeEnabled: true,
      },
    });

    manager.connect(['articles'], (chunk) => {
      chunks.push(chunk);
    });

    manager.publish(createEvent('create'), contentTypes);
    manager.publish(createEvent('update'), contentTypes);
    manager.publish(createEvent('delete'), contentTypes);

    expect(chunks.filter((chunk) => chunk.includes('event: update'))).toHaveLength(1);
    expect(chunks.some((chunk) => chunk.includes('"action":"update"'))).toBe(true);
  });

  it('does not publish realtime events when realtimeEnabled is false', () => {
    const manager = createRealtimeStreamManager();
    const chunks: string[] = [];
    const contentTypes = createContentTypes({
      articles: {
        realtimeActions: { create: true, delete: true, update: true },
        realtimeEnabled: false,
      },
    });

    manager.connect(['articles'], (chunk) => {
      chunks.push(chunk);
    });

    manager.publish(createEvent('create'), contentTypes);
    manager.publish(createEvent('update'), contentTypes);
    manager.publish(createEvent('delete'), contentTypes);

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toContain('event: ready');
  });

  it('falls back for legacy content types without realtimeActions', () => {
    const manager = createRealtimeStreamManager();
    const chunks: string[] = [];
    const contentTypes = {
      get(id: string) {
        if (id !== 'articles') {
          return null;
        }

        return {
          displayName: 'Article',
          fields: [],
          id: 'articles',
          kind: 'collection',
          realtimeEnabled: true,
          slug: 'articles',
        } as any;
      },
    };

    manager.connect(['articles'], (chunk) => {
      chunks.push(chunk);
    });

    manager.publish(createEvent('create'), contentTypes);

    expect(chunks.some((chunk) => chunk.includes('"contentTypeSlug":"articles"'))).toBe(true);
  });
});

function createContentTypes(
  records: Record<string, { realtimeActions: { create: boolean; delete: boolean; update: boolean }; realtimeEnabled: boolean }>,
) {
  return {
    get(id: string) {
      const record = records[id];

      if (!record) {
        return null;
      }

      return {
        displayName: 'Article',
        fields: [],
        id,
        kind: 'collection' as const,
        realtimeActions: record.realtimeActions,
        realtimeEnabled: record.realtimeEnabled,
        slug: id,
      };
    },
  };
}

function createEvent(action: 'create' | 'delete' | 'update') {
  return {
    action,
    actorEmail: 'admin@example.com',
    actorRole: 'admin' as const,
    createdAt: '2026-04-30T00:00:00.000Z',
    details: {
      contentTypeId: 'articles',
    },
    name: `content-entries.${action}` as const,
    scope: 'content-entries' as const,
    subjectId: 'entry-1',
  };
}
