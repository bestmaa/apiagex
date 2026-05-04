import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildServer } from '../packages/server/src/app.js';
import {
  LOCAL_DEV_OWNER_EMAIL,
  LOCAL_DEV_OWNER_PASSWORD,
  readServerConfig,
} from '../packages/server/src/config.js';
import { runLocalReset } from './reset-local-dev.mjs';

describe('local reset smoke', () => {
  it('resets local data, recreates SQLite state, and logs in owner', async () => {
    const rootDir = await createLocalData();

    await runLocalReset({ apply: true, rootDir });
    await expect(readFile(join(rootDir, 'data/content-types.db'), 'utf8')).rejects.toThrow();

    const config = readServerConfig({
      APIAGEX_LOCAL_OWNER: 'true',
      NODE_ENV: 'development',
    });
    const app = await buildServer({
      ...config,
      contentTypesDatabaseFile: join(rootDir, 'data/content-types.db'),
      logger: false,
      mediaStorageDir: join(rootDir, 'data/uploads'),
    });
    const response = await app.inject({
      method: 'POST',
      payload: {
        email: LOCAL_DEV_OWNER_EMAIL,
        password: LOCAL_DEV_OWNER_PASSWORD,
      },
      url: '/auth/login',
    });

    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      user: {
        email: LOCAL_DEV_OWNER_EMAIL,
        role: 'owner',
      },
    });
  });
});

async function createLocalData(): Promise<string> {
  const rootDir = await mkdtemp(join(tmpdir(), 'apiagex-reset-smoke-'));
  const dataDir = join(rootDir, 'data');

  await mkdir(join(dataDir, 'uploads'), { recursive: true });
  await writeFile(join(dataDir, 'content-types.db'), 'old-db');
  await writeFile(join(dataDir, 'content-types.db-shm'), 'old-shm');
  await writeFile(join(dataDir, 'content-types.db-wal'), 'old-wal');
  await writeFile(join(dataDir, 'uploads/file.txt'), 'old-upload');

  return rootDir;
}
