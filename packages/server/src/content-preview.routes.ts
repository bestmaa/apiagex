import type { FastifyInstance } from 'fastify';

import { requireContentTypeAccess } from './content-entries.routes.helpers.js';
import type { ContentPreviewRouteOptions } from './content-preview.routes.type.js';

export async function registerContentPreviewRoutes(
  app: FastifyInstance,
  options: ContentPreviewRouteOptions,
): Promise<void> {
  app.post('/admin/content-types/:id/entries/:entryId/preview', async (request, reply) => {
    const { entryId, id } = request.params as { entryId: string; id: string };
    const entry = options.contentEntriesRepository.get(id, entryId);
    const access = requireContentTypeAccess(options, request, reply, id, 'read');

    if (!access) {
      return;
    }

    if (!entry) {
      return reply.code(404).send({ message: 'Entry not found' });
    }

    const token = options.auth.createPreviewToken({
      contentTypeId: access.contentType.id,
      entryId: entry.id,
    });
    const previewUrl = new URL(`/api/${encodeURIComponent(access.contentType.slug)}/${encodeURIComponent(entry.id)}?preview=${encodeURIComponent(token)}`, `${request.protocol}://${request.headers.host}`);

    return {
      previewUrl: previewUrl.toString(),
      status: 'ok',
      token,
    };
  });
}
