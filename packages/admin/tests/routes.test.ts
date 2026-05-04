// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createAdminRouter } from '../src/public/admin-router.js';

const indexHtml = readFileSync(join(process.cwd(), 'packages/admin/src/public/index.html'), 'utf8');
const baseUrl = 'http://127.0.0.1:4123/';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

beforeEach(() => {
  resetDocument();
  installDomShims();
  window.localStorage.clear();
  window.location.hash = '';
});

describe('admin route visibility', () => {
  it.each([
    ['#/schema', ['schema-shell', 'content-types-shell'], 'Content model'],
    ['#/entries', ['entries-shell'], 'Entries'],
    ['#/realtime', ['realtime-shell'], 'Realtime'],
    ['#/roles', ['roles-shell'], 'Roles'],
    ['#/webhooks', ['webhooks-shell'], 'Webhooks'],
    ['#/docs', ['admin-docs-shell'], 'Docs'],
  ])('shows only the %s page', (hash, visibleIds, title) => {
    window.location.hash = hash;
    const router = createAdminRouter();
    router.render();

    expect(document.getElementById('route-title')?.textContent).toBe(title);
    expect(getVisibleRouteIds()).toEqual([...visibleIds].sort());
  });
});

describe('admin language toggle', () => {
  it('updates important headings when switching between English and Hindi', async () => {
    window.localStorage.setItem(
      'apiagex.admin.session',
      JSON.stringify({
        expiresAt: Date.now() + 60_000,
        role: 'admin',
        token: 'admin-token',
      }),
    );
    window.location.hash = '#/schema';
    installMockGlobals();
    await import('../src/public/app.js');
    await flush();

    expect(document.querySelector('#schema-shell h2')?.textContent).toBe('Create content type');
    expect(document.getElementById('roles-form-title')?.textContent).toBe('Create role');

    (document.querySelector('[data-lang="hi"]') as HTMLButtonElement | null)?.click();
    await flush();

    expect(document.querySelector('#schema-shell h2')?.textContent).toBe('Content type banao');
    expect(document.getElementById('roles-form-title')?.textContent).toBe('Role banao');

    (document.querySelector('[data-lang="en"]') as HTMLButtonElement | null)?.click();
    await flush();

    expect(document.querySelector('#schema-shell h2')?.textContent).toBe('Create content type');
    expect(document.getElementById('roles-form-title')?.textContent).toBe('Create role');
  });
});

function resetDocument() {
  document.open();
  document.write(indexHtml);
  document.close();
}

function getVisibleRouteIds(): string[] {
  return Array.from(document.querySelectorAll('[data-route-section]'))
    .filter((section) => !section.classList.contains('hidden') && !section.classList.contains('route-hidden'))
    .map((section) => (section as HTMLElement).id)
    .sort();
}

function installMockGlobals() {
  class MockEventSource {
    #listeners = new Map<string, Set<(event: MessageEvent) => void>>();

    constructor(_url: string) {}

    addEventListener(type: string, listener: (event: MessageEvent) => void) {
      if (!this.#listeners.has(type)) {
        this.#listeners.set(type, new Set());
      }

      this.#listeners.get(type)?.add(listener);
    }

    close() {}
  }

  vi.stubGlobal('EventSource', MockEventSource);
  installDomShims();
  vi.stubGlobal('fetch', mockFetch);
}

function installDomShims() {
  vi.stubGlobal('scrollTo', () => undefined);
  Object.defineProperty(Element.prototype, 'scrollTo', {
    configurable: true,
    value: () => undefined,
  });
  Object.defineProperty(Element.prototype, 'scrollIntoView', {
    configurable: true,
    value: () => undefined,
  });
}

async function mockFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = new URL(typeof input === 'string' ? input : input.toString(), baseUrl);
  const path = `${url.pathname}${url.search}`;

  if (path === '/admin/content-types' || path === '/api/content-types') {
    return jsonResponse({
      items: [
        {
          displayName: 'Article',
          fields: [],
          id: 'articles',
          kind: 'collection',
          permissions: {
            create: ['admin', 'editor'],
            delete: ['admin'],
            list: ['admin', 'editor', 'viewer'],
            read: ['admin', 'editor', 'viewer'],
            update: ['admin'],
          },
          realtimeActions: {
            create: true,
            delete: false,
            update: false,
          },
          realtimeEnabled: true,
          slug: 'articles',
        },
      ],
      status: 'ok',
    });
  }

  if (path === '/admin/roles' || path === '/api/roles') {
    return jsonResponse({ items: [], status: 'ok' });
  }

  if (path === '/admin/audit-logs' || path === '/api/audit-logs') {
    return jsonResponse({ items: [], status: 'ok' });
  }

  if (path === '/admin/webhooks' || path === '/api/webhooks') {
    return jsonResponse({ items: [], status: 'ok' });
  }

  if (path === '/api/media-files') {
    return jsonResponse({ items: [], status: 'ok' });
  }

  if (path === '/api/migrations') {
    return jsonResponse({ items: [], status: 'ok' });
  }

  if (path === '/api/health/detail') {
    return jsonResponse({
      cache: { publicResponses: 'enabled', schema: 'enabled' },
      docs: '/docs',
      requestIdHeader: 'x-request-id',
      scheduler: { status: 'running' },
      service: 'apiagex',
      status: 'ok',
      storage: { driver: 'local', uploadsPath: '/tmp/uploads' },
    });
  }

  if (path.startsWith('/api/content-types/')) {
    return jsonResponse({ items: [], status: 'ok' });
  }

  if (path.startsWith('/api/search')) {
    return jsonResponse({ items: [], query: url.searchParams.get('q') ?? '', status: 'ok' });
  }

  if (path === '/realtime/stream') {
    return new Response('', {
      headers: {
        'content-type': 'text/event-stream; charset=utf-8',
      },
      status: 200,
    });
  }

  if (url.pathname === '/auth/login') {
    return jsonResponse({
      status: 'ok',
      token: 'admin-token',
      user: { email: 'admin@example.com', role: 'admin' },
    });
  }

  return jsonResponse({ items: [], status: 'ok' }, 404);
}

function jsonResponse(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
    status,
  });
}

function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
