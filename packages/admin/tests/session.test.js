import { afterEach, describe, expect, it, vi } from 'vitest';

import { getSession, isSessionExpired, setSession } from '../src/public/session.js';

const storage = createStorage();

afterEach(() => {
  vi.unstubAllGlobals();
  storage.clear();
});

describe('session helpers', () => {
  it('stores role, token, and expiry', () => {
    vi.stubGlobal('window', { localStorage: storage });

    setSession({
      expiresAt: 1234,
      role: 'editor',
      token: 'token-123',
    });

    expect(getSession()).toEqual({
      expiresAt: 1234,
      role: 'editor',
      token: 'token-123',
    });
  });

  it('detects expired sessions', () => {
    expect(
      isSessionExpired({
        expiresAt: Date.now() - 1,
        role: 'admin',
        token: 'token-123',
      }),
    ).toBe(true);
  });
});

function createStorage() {
  const map = new Map();

  return {
    clear() {
      map.clear();
    },
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    removeItem(key) {
      map.delete(key);
    },
    setItem(key, value) {
      map.set(key, String(value));
    },
  };
}
