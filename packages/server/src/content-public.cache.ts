import type { PublicResponseCache } from './content-public.cache.type.js';

export function createPublicResponseCache(ttlMs = 5000): PublicResponseCache {
  const entries = new Map<string, { expiresAt: number; value: unknown }>();

  return {
    clear() {
      entries.clear();
    },
    delete(key: string) {
      entries.delete(key);
    },
    get<T>(key: string): T | null {
      const entry = entries.get(key);

      if (!entry) {
        return null;
      }

      if (entry.expiresAt <= Date.now()) {
        entries.delete(key);
        return null;
      }

      return entry.value as T;
    },
    set<T>(key: string, value: T) {
      entries.set(key, {
        expiresAt: Date.now() + ttlMs,
        value,
      });
    },
  };
}
