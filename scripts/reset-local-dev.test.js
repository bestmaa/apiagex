import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { createResetPlan, runLocalReset } from './reset-local-dev.mjs';

describe('local reset workflow', () => {
  it('targets only known local SQLite and upload paths', async () => {
    const rootDir = await createFixture();
    const plan = createResetPlan(rootDir);

    expect(plan.map((item) => item.target)).toEqual([
      'data/content-types.db',
      'data/content-types.db-shm',
      'data/content-types.db-wal',
      'data/uploads',
    ]);
  });

  it('keeps files during dry-run and removes them only with apply', async () => {
    const rootDir = await createFixture();

    await runLocalReset({ rootDir });

    await expect(readFile(join(rootDir, 'data/content-types.db'), 'utf8')).resolves.toBe('db');

    await runLocalReset({ apply: true, rootDir });

    await expect(readFile(join(rootDir, 'data/content-types.db'), 'utf8')).rejects.toThrow();
    await expect(readFile(join(rootDir, 'data/uploads/file.txt'), 'utf8')).rejects.toThrow();
  });
});

async function createFixture() {
  const rootDir = await mkdtemp(join(tmpdir(), 'apiagex-reset-'));
  const dataDir = join(rootDir, 'data');

  await mkdir(join(dataDir, 'uploads'), { recursive: true });
  await writeFile(join(dataDir, 'content-types.db'), 'db');
  await writeFile(join(dataDir, 'content-types.db-shm'), 'shm');
  await writeFile(join(dataDir, 'content-types.db-wal'), 'wal');
  await writeFile(join(dataDir, 'uploads/file.txt'), 'upload');

  return rootDir;
}
