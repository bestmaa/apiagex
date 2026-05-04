import type { FastifyInstance } from 'fastify';

import { recordAudit } from './audit.js';
import type { ContentFieldsRouteOptions } from './content-fields.routes.type.js';
import type { ContentTypeFieldInput } from './content-types.routes.type.js';
import { createPermissionGuard } from './permissions.js';

export async function registerContentFieldsRoutes(
  app: FastifyInstance,
  options: ContentFieldsRouteOptions,
): Promise<void> {
  const store = options.repository;
  const readGuard = createPermissionGuard(options.auth, 'content-fields', 'read');
  const writeGuard = createPermissionGuard(options.auth, 'content-fields', 'write');

  app.get('/admin/content-types/:id/fields', { preHandler: readGuard }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const contentType = store.get(id);

    if (!contentType) {
      return reply.code(404).send({ message: 'Content type not found' });
    }

    return {
      items: store.listFields(id),
      status: 'ok',
    };
  });

  app.post('/admin/content-types/:id/fields', { preHandler: writeGuard }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const input = request.body as ContentTypeFieldInput;
    const contentType = store.get(id);

    if (!contentType) {
      return reply.code(404).send({ message: 'Content type not found' });
    }

    if (!isValidRelationFieldInput(store, input)) {
      return reply.code(400).send({ message: 'Invalid relation target' });
    }

    const record = store.createField(id, input);

    if (!record) {
      return reply.code(404).send({ message: 'Content type not found' });
    }

    recordAudit(
      options.auth,
      options.audit,
      request.headers.authorization,
      'content-fields',
      'create',
      record.id,
      {
        contentTypeId: record.contentTypeId,
        contentTypeSlug: contentType.slug,
        key: record.key,
        label: record.label,
        targetContentTypeId: record.settings?.targetContentTypeId ?? null,
        type: record.type,
      },
      options.events,
    );

    return reply.code(201).send(record);
  });

  app.put('/admin/content-types/:id/fields/:fieldKey', { preHandler: writeGuard }, async (request, reply) => {
    const { id, fieldKey } = request.params as { fieldKey: string; id: string };
    const input = request.body as ContentTypeFieldInput;
    const contentType = store.get(id);

    if (!contentType) {
      return reply.code(404).send({ message: 'Content type not found' });
    }

    if (!isValidRelationFieldInput(store, input)) {
      return reply.code(400).send({ message: 'Invalid relation target' });
    }

    const record = store.updateField(id, fieldKey, input);

    if (!record) {
      return reply.code(404).send({ message: 'Field not found' });
    }

    recordAudit(
      options.auth,
      options.audit,
      request.headers.authorization,
      'content-fields',
      'update',
      record.id,
      {
        contentTypeId: record.contentTypeId,
        contentTypeSlug: contentType.slug,
        key: record.key,
        label: record.label,
        targetContentTypeId: record.settings?.targetContentTypeId ?? null,
        type: record.type,
      },
      options.events,
    );

    return reply.send(record);
  });

  app.delete('/admin/content-types/:id/fields/:fieldKey', { preHandler: writeGuard }, async (request, reply) => {
    const { id, fieldKey } = request.params as { fieldKey: string; id: string };
    const contentType = store.get(id);
    const deleted = store.deleteField(id, fieldKey);

    if (!deleted) {
      return reply.code(404).send({ message: 'Field not found' });
    }

    recordAudit(
      options.auth,
      options.audit,
      request.headers.authorization,
      'content-fields',
      'delete',
      `${id}:${fieldKey}`,
      {
        contentTypeId: id,
        contentTypeSlug: contentType?.slug ?? id,
        fieldKey,
      },
      options.events,
    );

    return reply.code(204).send();
  });
}

function isValidRelationFieldInput(
  repository: ContentFieldsRouteOptions['repository'],
  input: ContentTypeFieldInput,
): boolean {
  if (input.type !== 'relation') {
    return true;
  }

  const targetContentTypeId = input.settings?.targetContentTypeId;

  if (!targetContentTypeId) {
    return false;
  }

  return Boolean(repository.get(targetContentTypeId));
}
