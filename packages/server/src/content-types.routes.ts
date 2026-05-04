import type { FastifyInstance } from 'fastify';

import { recordAudit } from './audit.js';
import { DEFAULT_CONTENT_TYPE_PERMISSIONS } from './content-type-permissions.js';
import type { ContentTypesRepository } from './content-types.repository.type.js';
import type { ContentTypeInput, RegisterContentTypesRoutesOptions } from './content-types.routes.type.js';
import { createPermissionGuard } from './permissions.js';

export async function registerContentTypesRoutes(
  app: FastifyInstance,
  options: RegisterContentTypesRoutesOptions,
): Promise<void> {
  const store = options.repository;
  const readGuard = createPermissionGuard(options.auth, 'content-types', 'read');
  const writeGuard = createPermissionGuard(options.auth, 'content-types', 'write');

  app.get('/admin/content-types', { preHandler: readGuard }, async () => ({
    items: store.list(),
    status: 'ok',
  }));

  app.post('/admin/content-types', { preHandler: writeGuard }, async (request, reply) => {
    const input = request.body as ContentTypeInput;

    if (!hasValidRealtimeSettings(input)) {
      return reply.code(400).send({ message: 'Invalid realtime settings' });
    }

    if (!hasValidPermissions(input)) {
      return reply.code(400).send({ message: 'Invalid permissions settings' });
    }

    if (!hasValidRelationTargets(store, input)) {
      return reply.code(400).send({ message: 'Invalid relation target' });
    }

    const record = store.create(input);

    recordAudit(
      options.auth,
      options.audit,
      request.headers.authorization,
      'content-types',
      'create',
      record.id,
      {
        displayName: record.displayName,
        kind: record.kind,
        permissions: record.permissions,
        realtimeActions: record.realtimeActions,
        realtimeEnabled: record.realtimeEnabled,
        slug: record.slug,
      },
      options.events,
    );

    return reply.code(201).send(record);
  });

  app.post('/admin/content-types/:id/duplicate', { preHandler: writeGuard }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const input = request.body as Partial<ContentTypeInput>;
    const source = store.get(id);

    if (!source) {
      return reply.code(404).send({ message: 'Content type not found' });
    }

    const slug = typeof input.slug === 'string' && input.slug.trim() ? input.slug.trim() : `${source.slug}-copy`;
    const displayName = typeof input.displayName === 'string' && input.displayName.trim() ? input.displayName.trim() : `${source.displayName} Copy`;

    if (store.get(slug)) {
      return reply.code(409).send({ message: 'Content type slug already exists' });
    }

    const record = store.create({
      displayName,
      fields: source.fields.map((field) => ({
        ...field,
        ...(field.type === 'relation' && field.settings?.targetContentTypeId === source.slug
          ? { settings: { ...field.settings, targetContentTypeId: slug } }
          : field.settings
            ? { settings: field.settings }
            : {}),
      })),
      kind: source.kind,
      permissions: source.permissions,
      realtimeActions: source.realtimeActions,
      realtimeEnabled: source.realtimeEnabled,
      slug,
    });

    recordAudit(
      options.auth,
      options.audit,
      request.headers.authorization,
      'content-types',
      'create',
      record.id,
      {
        displayName: record.displayName,
        duplicatedFrom: source.slug,
        kind: record.kind,
        permissions: record.permissions,
        realtimeActions: record.realtimeActions,
        realtimeEnabled: record.realtimeEnabled,
        slug: record.slug,
      },
      options.events,
    );

    return reply.code(201).send(record);
  });

  app.put('/admin/content-types/:id', { preHandler: writeGuard }, async (request, reply) => {
    const input = request.body as ContentTypeInput;
    const { id } = request.params as { id: string };

    if (!hasValidRealtimeSettings(input)) {
      return reply.code(400).send({ message: 'Invalid realtime settings' });
    }

    if (!hasValidPermissions(input)) {
      return reply.code(400).send({ message: 'Invalid permissions settings' });
    }

    if (!hasValidRelationTargets(store, input)) {
      return reply.code(400).send({ message: 'Invalid relation target' });
    }

    const record = store.update(id, input);

    if (!record) {
      return reply.code(404).send({ message: 'Content type not found' });
    }

    recordAudit(
      options.auth,
      options.audit,
      request.headers.authorization,
      'content-types',
      'update',
      record.id,
      {
        displayName: record.displayName,
        kind: record.kind,
        permissions: record.permissions,
        realtimeActions: record.realtimeActions,
        realtimeEnabled: record.realtimeEnabled,
        slug: record.slug,
      },
      options.events,
    );

    return reply.send(record);
  });

  app.delete('/admin/content-types/:id', { preHandler: writeGuard }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const existing = store.get(id);
    const deleted = store.delete(id);

    if (!deleted) {
      return reply.code(404).send({ message: 'Content type not found' });
    }

    recordAudit(
      options.auth,
      options.audit,
      request.headers.authorization,
      'content-types',
      'delete',
      id,
      {
        displayName: existing?.displayName ?? id,
        kind: existing?.kind ?? 'collection',
        permissions: existing?.permissions ?? DEFAULT_CONTENT_TYPE_PERMISSIONS,
        realtimeActions: existing?.realtimeActions ?? { create: false, delete: false, update: false },
        realtimeEnabled: existing?.realtimeEnabled ?? false,
        slug: existing?.slug ?? id,
      },
      options.events,
    );

    return reply.code(204).send();
  });
}

function hasValidRelationTargets(store: ContentTypesRepository, input: ContentTypeInput): boolean {
  return input.fields.every((field) => {
    if (field.type !== 'relation') {
      return true;
    }

    const targetContentTypeId = field.settings?.targetContentTypeId;

    if (!targetContentTypeId) {
      return false;
    }

    return Boolean(store.get(targetContentTypeId) || targetContentTypeId === input.slug);
  });
}

function hasValidRealtimeSettings(input: ContentTypeInput): boolean {
  if (typeof input.realtimeEnabled !== 'undefined' && typeof input.realtimeEnabled !== 'boolean') {
    return false;
  }

  if (typeof input.realtimeActions === 'undefined') {
    return true;
  }

  if (!input.realtimeActions || Array.isArray(input.realtimeActions) || typeof input.realtimeActions !== 'object') {
    return false;
  }

  return ['create', 'delete', 'update'].every((key) => {
    const value = input.realtimeActions?.[key as keyof NonNullable<ContentTypeInput['realtimeActions']>];
    return typeof value === 'undefined' || typeof value === 'boolean';
  });
}

function hasValidPermissions(input: ContentTypeInput): boolean {
  if (typeof input.permissions === 'undefined') {
    return true;
  }

  if (!input.permissions || Array.isArray(input.permissions) || typeof input.permissions !== 'object') {
    return false;
  }

  return ['create', 'delete', 'list', 'read', 'update'].every((key) => {
    const value = input.permissions?.[key as keyof NonNullable<ContentTypeInput['permissions']>];

    if (typeof value === 'undefined') {
      return true;
    }

    return Array.isArray(value) && value.every((role) => typeof role === 'string' && role.trim().length > 0);
  });
}
