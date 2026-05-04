import { describe, expect, it, vi } from 'vitest';

import { createRealtimeClient } from '../src/public/realtime.js';

describe('createRealtimeClient', () => {
  it('tracks connection status and parses update events', () => {
    const statuses = [];
    const updates = [];
    const source = createFakeSource();
    const client = createRealtimeClient({
      eventSourceFactory: () => source,
      onEvent: (detail) => {
        updates.push(detail);
      },
      onStatus: (status) => {
        statuses.push(status);
      },
    });

    client.connect();
    source.emit('open');
    source.emit('ready', { status: 'ok' });
    source.emit('update', {
      contentTypeSlug: 'articles',
      scope: 'content-entries',
      subjectId: 'entry-1',
    });
    client.close();

    expect(statuses).toEqual(['connecting', 'connected', 'connected']);
    expect(updates).toEqual([
      {
        contentTypeSlug: 'articles',
        scope: 'content-entries',
        subjectId: 'entry-1',
      },
    ]);
    expect(source.closed).toBe(true);
  });
});

function createFakeSource() {
  const listeners = new Map();

  return {
    closed: false,
    addEventListener(name, handler) {
      listeners.set(name, handler);
    },
    close() {
      this.closed = true;
    },
    emit(name, payload = {}) {
      const handler = listeners.get(name);

      if (!handler) {
        return;
      }

      handler({
        data: JSON.stringify(payload),
        type: name,
      });
    },
  };
}
