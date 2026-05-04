import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import type { MediaStorageAdapter } from './media-storage.adapter.type.js';

export function createLocalMediaStorage(storageDir: string): MediaStorageAdapter {
  return {
    clear() {
      mkdirSync(storageDir, { recursive: true });

      for (const entry of readdirSync(storageDir, { withFileTypes: true })) {
        rmSync(join(storageDir, entry.name), { force: true, recursive: true });
      }
    },
    readBase64(storagePath: string): string {
      try {
        return readFileSync(storagePath).toString('base64');
      } catch {
        return '';
      }
    },
    restore(storagePath: string, contentBase64: string) {
      const buffer = Buffer.from(contentBase64, 'base64');
      mkdirSync(dirname(storagePath), { recursive: true });
      writeFileSync(storagePath, buffer);
    },
    save(filename: string, contentBase64: string) {
      const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = join(storageDir, `${Date.now()}-${sanitized || 'upload'}`);
      const buffer = Buffer.from(contentBase64, 'base64');
      mkdirSync(dirname(storagePath), { recursive: true });
      writeFileSync(storagePath, buffer);
      return storagePath;
    },
  };
}
