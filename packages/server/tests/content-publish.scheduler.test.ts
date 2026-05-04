import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { createContentPublishScheduler } from '../src/content-publish.scheduler.js';
import { createSqliteContentEntriesRepository } from '../src/content-entries.repository.js';
import { createSqliteContentTypesRepository } from '../src/content-types.repository.js';

describe('content publish scheduler', () => {
  it('publishes scheduled entries when their publish time has passed', async () => {
    const databaseFile = join(await mkdtemp(join(tmpdir(), 'apiagex-schedule-')), 'content-types.db');
    const contentTypesRepository = createSqliteContentTypesRepository(databaseFile);
    const contentEntriesRepository = createSqliteContentEntriesRepository(databaseFile);

    try {
      contentTypesRepository.create({
        displayName: 'Article',
        fields: [
          {
            key: 'title',
            label: 'Title',
            repeatable: false,
            required: true,
            sortOrder: 0,
            type: 'text',
          },
        ],
        kind: 'collection',
        slug: 'articles',
      });

      const created = contentEntriesRepository.create('articles', {
        data: {
          title: 'Scheduled article',
        },
        publishAt: '2026-04-30T00:00:00.000Z',
        status: 'scheduled',
      });

      expect(created).toMatchObject({
        publishAt: '2026-04-30T00:00:00.000Z',
        status: 'scheduled',
      });

      const scheduler = createContentPublishScheduler({
        contentTypesRepository,
        repository: contentEntriesRepository,
      });

      const published = await scheduler.sweep(new Date('2026-04-30T00:01:00.000Z'));
      const entry = contentEntriesRepository.get('articles', created!.id);

      expect(published).toHaveLength(1);
      expect(published[0]).toMatchObject({
        id: created!.id,
        publishAt: '2026-04-30T00:00:00.000Z',
        status: 'published',
      });
      expect(entry).toMatchObject({
        id: created!.id,
        publishAt: '2026-04-30T00:00:00.000Z',
        status: 'published',
      });
    } finally {
      contentEntriesRepository.close();
      contentTypesRepository.close();
    }
  });
});
