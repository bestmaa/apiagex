import type { FastifyReply, FastifyRequest } from 'fastify';

import { requireAdminToken } from './auth.js';
import { canAccessContentTypeWithRoleCatalog } from './content-role-access.js';
import type { ContentEntriesRouteOptions, ContentEntryInput, ContentTypeFieldDefinition } from './content-entries.routes.type.js';
import type { ContentTypesLookup } from './content-entries.routes.type.js';
import type { RolesRepository } from './roles.repository.type.js';

type ContentTypeRecord = NonNullable<ReturnType<ContentTypesLookup['get']>>;

export interface ContentTypeAccessOptions {
  auth: ContentEntriesRouteOptions['auth'];
  contentTypesRepository: ContentTypesLookup;
  rolesRepository: Pick<RolesRepository, 'get' | 'getByName'>;
}

export function requireContentTypeAccess(
  options: ContentTypeAccessOptions,
  request: FastifyRequest,
  reply: FastifyReply,
  contentTypeId: string,
  action: 'create' | 'delete' | 'list' | 'read' | 'update',
): { contentType: ContentTypeRecord; sessionRole: string } | null {
  const contentType = options.contentTypesRepository.get(contentTypeId);

  if (!contentType) {
    reply.code(404).send({ message: 'Content type not found' });
    return null;
  }

  const session = requireAdminToken(options.auth, request.headers.authorization);

  if (!session) {
    reply.code(401).send({ message: 'Authentication required' });
    return null;
  }

  if (
    !canAccessContentTypeWithRoleCatalog(
      options.rolesRepository,
      contentType.id,
      contentType.permissions,
      action,
      session.role,
    )
  ) {
    reply.code(403).send({ message: 'Forbidden' });
    return null;
  }

  return {
    contentType,
    sessionRole: session.role,
  };
}

export function normalizeWorkflowInput(input: ContentEntryInput): {
  error: string | null;
  input: ContentEntryInput;
} {
  const publishAt = normalizePublishAt(input.publishAt);

  if (input.status === 'scheduled' && !publishAt) {
    return {
      error: 'Publish at is required for scheduled entries',
      input,
    };
  }

  if (input.status !== 'scheduled') {
    return {
      error: null,
      input: {
        ...input,
        publishAt: null,
      },
    };
  }

  return {
    error: null,
    input: {
      ...input,
      publishAt,
    },
  };
}

export function normalizePublishAt(value: string | null | undefined): string | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function validateRequiredFields(fields: readonly ContentTypeFieldDefinition[], data: Record<string, unknown>): string | null {
  for (const field of fields) {
    if (!field.required) {
      continue;
    }

    const value = data[field.key];

    if (value === undefined || value === null || value === '') {
      return field.label;
    }
  }

  return null;
}
