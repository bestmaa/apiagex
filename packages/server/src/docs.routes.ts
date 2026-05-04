import type { FastifyInstance } from 'fastify';

import type { ContentTypesRepository } from './content-types.repository.type.js';

export async function registerDocsRoutes(
  app: FastifyInstance,
  options: { contentTypesRepository: ContentTypesRepository },
): Promise<void> {
  app.get('/api/docs/content-types', async () => {
    const items = options.contentTypesRepository
      .list()
      .slice()
      .sort((left, right) => left.slug.localeCompare(right.slug))
      .map((contentType) => ({
        displayName: contentType.displayName,
        fieldCount: contentType.fields.length,
        id: contentType.id,
        kind: contentType.kind,
        permissions: contentType.permissions,
        realtimeActions: contentType.realtimeActions,
        realtimeEnabled: contentType.realtimeEnabled,
        slug: contentType.slug,
      }));

    return {
      items,
      status: 'ok',
    };
  });
}
