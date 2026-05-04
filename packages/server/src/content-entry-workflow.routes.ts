import type { FastifyInstance } from 'fastify';

import { recordAudit } from './audit.js';
import { requireContentTypeAccess } from './content-entries.routes.helpers.js';
import type { ContentEntriesRouteOptions, ContentEntryRecord } from './content-entries.routes.type.js';

export async function registerContentEntryWorkflowRoutes(
  app: FastifyInstance,
  options: ContentEntriesRouteOptions,
): Promise<void> {
  app.post('/admin/content-types/:id/entries/:entryId/approve', async (request, reply) => {
    const { entryId, id } = request.params as { entryId: string; id: string };
    const access = requireContentTypeAccess(options, request, reply, id, 'update');

    if (!access) {
      return;
    }

    const outcome = transitionEntryWorkflow(options.repository, id, entryId, 'published');

    if (outcome.error) {
      return reply.code(outcome.error.statusCode).send({ message: outcome.error.message });
    }

    recordAudit(options.auth, options.audit, request.headers.authorization, 'content-entries', 'update', outcome.record.id, {
      contentTypeId: id,
      contentTypeSlug: access.contentType.slug,
      previousStatus: outcome.previousStatus,
      status: outcome.record.status,
      workflowAction: 'approve',
    }, options.events);

    return reply.send(outcome.record);
  });

  app.post('/admin/content-types/:id/entries/:entryId/reject', async (request, reply) => {
    const { entryId, id } = request.params as { entryId: string; id: string };
    const access = requireContentTypeAccess(options, request, reply, id, 'update');

    if (!access) {
      return;
    }

    const outcome = transitionEntryWorkflow(options.repository, id, entryId, 'draft');

    if (outcome.error) {
      return reply.code(outcome.error.statusCode).send({ message: outcome.error.message });
    }

    recordAudit(options.auth, options.audit, request.headers.authorization, 'content-entries', 'update', outcome.record.id, {
      contentTypeId: id,
      contentTypeSlug: access.contentType.slug,
      previousStatus: outcome.previousStatus,
      status: outcome.record.status,
      workflowAction: 'reject',
    }, options.events);

    return reply.send(outcome.record);
  });
}

function transitionEntryWorkflow(
  store: ContentEntriesRouteOptions['repository'],
  contentTypeId: string,
  entryId: string,
  status: 'draft' | 'published',
): {
  error: { message: string; statusCode: number } | null;
  previousStatus: string;
  record: ContentEntryRecord;
} {
  const current = store.get(contentTypeId, entryId);

  if (!current) {
    return {
      error: { message: 'Entry not found', statusCode: 404 },
      previousStatus: '',
      record: { contentTypeId, data: {}, id: entryId, publishAt: null, status: 'draft' },
    };
  }

  if (current.status !== 'pendingApproval') {
    return {
      error: { message: 'Entry must be pending approval', statusCode: 409 },
      previousStatus: current.status,
      record: current,
    };
  }

  const updated = store.update(contentTypeId, entryId, {
    data: current.data,
    publishAt: null,
    status,
  });

  if (!updated) {
    return {
      error: { message: 'Entry not found', statusCode: 404 },
      previousStatus: current.status,
      record: current,
    };
  }

  return {
    error: null,
    previousStatus: current.status,
    record: updated,
  };
}
