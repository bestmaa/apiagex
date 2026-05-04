import type { MediaStorageAdapter } from './media-storage.adapter.type.js';
import { createLocalMediaStorage } from './media-storage.local.js';

export type MediaStorageDriver = 'local' | 'minio' | 's3';

export function createMediaStorageAdapter(storageDir: string, driver: MediaStorageDriver): MediaStorageAdapter {
  if (driver === 'local') {
    return createLocalMediaStorage(storageDir);
  }

  return createUnsupportedMediaStorage(driver);
}

function createUnsupportedMediaStorage(driver: Exclude<MediaStorageDriver, 'local'>): MediaStorageAdapter {
  const message = `Media storage driver "${driver}" is not implemented yet`;

  return {
    clear() {
      throw new Error(message);
    },
    readBase64() {
      throw new Error(message);
    },
    restore() {
      throw new Error(message);
    },
    save() {
      throw new Error(message);
    },
  };
}
