import type { FastifyInstance } from 'fastify';

import { recordAudit } from './audit.js';
import type { MediaRoutesOptions, UploadMediaFileInput } from './media.routes.type.js';
import { createPermissionGuard } from './permissions.js';

export async function registerMediaRoutes(
  app: FastifyInstance,
  options: MediaRoutesOptions,
): Promise<void> {
  const store = options.repository;
  const readGuard = createPermissionGuard(options.auth, 'media-files', 'read');
  const writeGuard = createPermissionGuard(options.auth, 'media-files', 'write');

  app.get('/admin/media-files', { preHandler: readGuard }, async () => ({
    items: store.list(),
    status: 'ok',
  }));

  app.post('/admin/media-files', { preHandler: writeGuard }, async (request, reply) => {
    const input = request.body as UploadMediaFileInput;
    const record = store.create({
      filename: input.filename,
      mimeType: input.mimeType,
      size: Buffer.byteLength(input.base64, 'base64'),
      storagePath: options.storage.save(input.filename, input.base64),
    });

    recordAudit(options.auth, options.audit, request.headers.authorization, 'media-files', 'create', record.id, {
      filename: record.filename,
      mimeType: record.mimeType,
      size: record.size,
    }, options.events);

    return reply.code(201).send(record);
  });
}
