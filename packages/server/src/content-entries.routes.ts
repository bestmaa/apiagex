import type { FastifyInstance } from 'fastify';

import { recordAudit } from './audit.js';
import type { ContentEntriesRouteOptions } from './content-entries.routes.type.js';
import { normalizeWorkflowInput, requireContentTypeAccess } from './content-entries.routes.helpers.js';
import { validateEntryData } from './content-entries.validation.js';
import { buildContentEntriesListView } from './content-entries.query.js';
import { registerContentEntryWorkflowRoutes } from './content-entry-workflow.routes.js';

export async function registerContentEntriesRoutes(
  app: FastifyInstance,
  options: ContentEntriesRouteOptions,
): Promise<void> {
  const store = options.repository;
  const contentTypes = options.contentTypesRepository;

  app.get('/admin/content-types/:id/entries', async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = request.query as { page?: string; pageSize?: string; q?: string; sort?: string; status?: string };
    const access = requireContentTypeAccess(options, request, reply, id, 'list');

    if (!access) {
      return;
    }

    return { ...buildContentEntriesListView(store.list(id), query), status: 'ok' };
  });

  app.get('/admin/content-types/:id/entries/:entryId', async (request, reply) => {
    const { entryId, id } = request.params as { entryId: string; id: string };
    const access = requireContentTypeAccess(options, request, reply, id, 'read');

    if (!access) {
      return;
    }

    const entry = store.get(id, entryId);

    if (!entry) {
      return reply.code(404).send({ message: 'Entry not found' });
    }

    return {
      item: entry,
      status: 'ok',
    };
  });

  app.post('/admin/content-types/:id/entries', async (request, reply) => {
    const { id } = request.params as { id: string };
    const input = request.body as Parameters<typeof store.create>[1];
    const access = requireContentTypeAccess(options, request, reply, id, 'create');

    if (!access) {
      return;
    }

    const validation = validateEntryData(
      contentTypes.listFields(id),
      input.data,
      options.mediaFilesRepository,
    );

    if (validation.error) {
      return reply.code(validation.error.statusCode).send({ message: validation.error.message });
    }

    const normalized = normalizeWorkflowInput(input);

    if (normalized.error) {
      return reply.code(400).send({ message: normalized.error });
    }

    const record = store.create(id, normalized.input);

    if (!record) {
      return reply.code(404).send({ message: 'Content type not found' });
    }

    recordAudit(options.auth, options.audit, request.headers.authorization, 'content-entries', 'create', record.id, {
      contentTypeId: id,
      contentTypeSlug: access.contentType.slug,
      status: record.status,
      publishAt: record.publishAt,
    }, options.events);

    return reply.code(201).send(record);
  });

  app.put('/admin/content-types/:id/entries/:entryId', async (request, reply) => {
    const { entryId, id } = request.params as { entryId: string; id: string };
    const input = request.body as Parameters<typeof store.update>[2];
    const access = requireContentTypeAccess(options, request, reply, id, 'update');

    if (!access) {
      return;
    }

    const validation = validateEntryData(
      contentTypes.listFields(id),
      input.data,
      options.mediaFilesRepository,
    );

    if (validation.error) {
      return reply.code(validation.error.statusCode).send({ message: validation.error.message });
    }

    const normalized = normalizeWorkflowInput(input);

    if (normalized.error) {
      return reply.code(400).send({ message: normalized.error });
    }

    const record = store.update(id, entryId, normalized.input);

    if (!record) {
      return reply.code(404).send({ message: 'Entry not found' });
    }

    recordAudit(options.auth, options.audit, request.headers.authorization, 'content-entries', 'update', record.id, {
      contentTypeId: id,
      contentTypeSlug: access.contentType.slug,
      status: record.status,
      publishAt: record.publishAt,
    }, options.events);

    return reply.send(record);
  });

  app.delete('/admin/content-types/:id/entries/:entryId', async (request, reply) => {
    const { entryId, id } = request.params as { entryId: string; id: string };
    const access = requireContentTypeAccess(options, request, reply, id, 'delete');

    if (!access) {
      return;
    }

    const deleted = store.delete(id, entryId);

    if (!deleted) {
      return reply.code(404).send({ message: 'Entry not found' });
    }

    recordAudit(
      options.auth,
      options.audit,
      request.headers.authorization,
      'content-entries',
      'delete',
      entryId,
      {
        contentTypeId: id,
        contentTypeSlug: access.contentType.slug,
      },
      options.events,
    );

    return reply.code(204).send();
  });

  app.get('/admin/content-types/:id/entries/:entryId/versions', async (request, reply) => {
    const { entryId, id } = request.params as { entryId: string; id: string };
    const access = requireContentTypeAccess(options, request, reply, id, 'read');

    if (!access) {
      return;
    }

    return {
      items: store.listVersions(id, entryId),
      status: 'ok',
    };
  });

  app.post('/admin/content-types/:id/entries/:entryId/versions/:versionId/restore', async (request, reply) => {
    const { entryId, id, versionId } = request.params as { entryId: string; id: string; versionId: string };
    const access = requireContentTypeAccess(options, request, reply, id, 'update');

    if (!access) {
      return;
    }

    const record = store.restoreVersion(id, entryId, versionId);

    if (!record) {
      return reply.code(404).send({ message: 'Version not found' });
    }

    recordAudit(options.auth, options.audit, request.headers.authorization, 'content-entries', 'update', record.id, {
      contentTypeId: id,
      contentTypeSlug: access.contentType.slug,
      restoredFromVersionId: versionId,
      status: record.status,
    }, options.events);

    return reply.send(record);
  });

  await registerContentEntryWorkflowRoutes(app, options);
}
