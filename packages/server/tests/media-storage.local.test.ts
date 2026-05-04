import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { createLocalMediaStorage } from '../src/media-storage.local.js';

describe('local media storage', () => {
  it('saves, reads, restores, and clears files on disk', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'apiagex-storage-'));
    const storage = createLocalMediaStorage(dir);
    const base64 = Buffer.from('hello').toString('base64');
    const storagePath = storage.save('photo.png', base64);

    expect(storage.readBase64(storagePath)).toBe(base64);

    const restoredBase64 = Buffer.from('world').toString('base64');
    storage.restore(join(dir, 'restored.png'), restoredBase64);
    expect(storage.readBase64(join(dir, 'restored.png'))).toBe(restoredBase64);

    storage.clear();

    expect(storage.readBase64(storagePath)).toBe('');
    expect(storage.readBase64(join(dir, 'restored.png'))).toBe('');
  });
});
