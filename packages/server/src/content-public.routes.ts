import type { FastifyInstance } from 'fastify';

import { getBearerToken } from './auth.js';
import {
  canAccessContentTypeAnonymously,
  DEFAULT_CONTENT_TYPE_PERMISSIONS,
} from './content-type-permissions.js';
import { canAccessContentTypeWithRoleCatalog } from './content-role-access.js';
import { parsePopulateParam, toPublicEntry } from './content-public.populate.js';
import type { ContentPublicRouteOptions, PublicEntryRecord } from './content-public.routes.type.js';

export async function registerContentPublicRoutes(
  app: FastifyInstance,
  options: ContentPublicRouteOptions,
): Promise<void> {
  const entries = options.contentEntriesRepository;
  const contentTypes = options.contentTypesRepository;

  app.get('/api/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const query = request.query as { populate?: string | string[]; preview?: string | string[] };
    const populate = parsePopulateParam(query.populate);
    const contentType = contentTypes.get(slug);

    if (!contentType) {
      return reply.code(404).send({ message: 'Content type not found' });
    }

    const access = resolvePublicAccess(options, request.headers.authorization, contentType.id, 'list');

    if (access.error) {
      return reply.code(access.statusCode).send({ message: access.message });
    }

    const preview = resolvePreview(query.preview, slug, contentType.id, options);

    if (preview.error) {
      return reply.code(preview.statusCode).send({ message: preview.message });
    }

    const cacheKey = buildCacheKey(slug, null, populate);
    const responseCache = preview.enabled ? null : options.responseCache;

    if (responseCache) {
      const cached = responseCache.get<PublicResponse>(cacheKey);

      if (cached) {
        return cached;
      }
    }

    const allEntries = preview.enabled ? entries.list(slug) : entries.list(slug).filter((entry) => entry.status === 'published');
    const visibleEntries = filterPreviewEntries(allEntries, preview.entryId);

    if (contentType.kind === 'single') {
      const item = visibleEntries[0];

      if (!item) {
        return reply.code(404).send({ message: 'Entry not found' });
      }

      const response = {
        item: toPublicEntry(item, contentTypes.listFields(contentType.id), options, populate, preview.enabled),
        status: 'ok',
      };

      responseCache?.set(cacheKey, response);
      return response;
    }

    const response = {
      items: visibleEntries.map((entry) => toPublicEntry(entry, contentTypes.listFields(contentType.id), options, populate, preview.enabled)),
      status: 'ok',
    };

    responseCache?.set(cacheKey, response);
    return response;
  });

  app.get('/api/:slug/:entryId', async (request, reply) => {
    const { entryId, slug } = request.params as { entryId: string; slug: string };
    const query = request.query as { populate?: string | string[]; preview?: string | string[] };
    const populate = parsePopulateParam(query.populate);
    const contentType = contentTypes.get(slug);

    if (!contentType) {
      return reply.code(404).send({ message: 'Content type not found' });
    }

    const access = resolvePublicAccess(options, request.headers.authorization, contentType.id, 'read');

    if (access.error) {
      return reply.code(access.statusCode).send({ message: access.message });
    }

    const preview = resolvePreview(query.preview, slug, contentType.id, options, entryId);

    if (preview.error) {
      return reply.code(preview.statusCode).send({ message: preview.message });
    }

    const cacheKey = buildCacheKey(slug, entryId, populate);
    const responseCache = preview.enabled ? null : options.responseCache;

    if (responseCache) {
      const cached = responseCache.get<PublicResponse>(cacheKey);

      if (cached) {
        return cached;
      }
    }

    const entry = entries.get(slug, entryId);

    if (!entry || (!preview.enabled && entry.status !== 'published')) {
      return reply.code(404).send({ message: 'Entry not found' });
    }

    const response = {
      item: toPublicEntry(entry, contentTypes.listFields(contentType.id), options, populate, preview.enabled),
      status: 'ok',
    };

    responseCache?.set(cacheKey, response);
    return response;
  });
}

function resolvePreview(
  value: string | string[] | undefined,
  slug: string,
  contentTypeId: string | undefined,
  options: ContentPublicRouteOptions,
  entryId?: string,
): {
  enabled: boolean;
  entryId?: string;
  error: boolean;
  message: string;
  statusCode: number;
} {
  if (!value) {
    return { enabled: false, error: false, message: '', statusCode: 200 };
  }

  const token = Array.isArray(value) ? value.find((item) => typeof item === 'string' && item.length > 0) : value;

  if (!token) {
    return { enabled: false, error: true, message: 'Invalid preview token', statusCode: 403 };
  }

  const payload = options.previewAuth?.verifyPreviewToken(token);

  if (!payload) {
    return { enabled: false, error: true, message: 'Invalid preview token', statusCode: 403 };
  }

  if (payload.contentTypeId !== contentTypeId || payload.contentTypeId !== slug) {
    return { enabled: false, error: true, message: 'Invalid preview token', statusCode: 403 };
  }

  if (entryId && payload.entryId && payload.entryId !== entryId) {
    return { enabled: false, error: true, message: 'Invalid preview token', statusCode: 403 };
  }

  return {
    enabled: true,
    error: false,
    message: '',
    statusCode: 200,
    ...(payload.entryId ? { entryId: payload.entryId } : {}),
  };
}

function resolvePublicAccess(
  options: ContentPublicRouteOptions,
  authorizationHeader: string | undefined,
  contentTypeId: string,
  action: 'list' | 'read',
): {
  error: boolean;
  message: string;
  statusCode: number;
} {
  const contentType = options.contentTypesRepository.get(contentTypeId);

  if (!contentType) {
    return { error: true, message: 'Content type not found', statusCode: 404 };
  }

  const permissions = contentType.permissions ?? DEFAULT_CONTENT_TYPE_PERMISSIONS;

  const token = getBearerToken(authorizationHeader);

  if (!token) {
    if (canAccessContentTypeAnonymously(permissions, action)) {
      return { error: false, message: '', statusCode: 200 };
    }

    return { error: true, message: 'Authentication required', statusCode: 401 };
  }

  const session = options.previewAuth?.verifyToken(token);

  if (!session) {
    return { error: true, message: 'Authentication required', statusCode: 401 };
  }

  if (
    !canAccessContentTypeWithRoleCatalog(
      options.rolesRepository,
      contentTypeId,
      permissions,
      action,
      session.role,
    )
  ) {
    return { error: true, message: 'Forbidden', statusCode: 403 };
  }

  return { error: false, message: '', statusCode: 200 };
}

function filterPreviewEntries<T extends { id: string }>(entries: readonly T[], previewEntryId?: string): readonly T[] {
  if (!previewEntryId) {
    return entries;
  }

  return entries.filter((entry) => entry.id === previewEntryId);
}

function buildCacheKey(slug: string, entryId: string | null, populate: readonly string[]): string {
  return ['public', slug, entryId ?? '*', populate.length ? populate.join(',') : 'default'].join(':');
}

type PublicResponse = { item: PublicEntryRecord; status: 'ok' } | { items: readonly PublicEntryRecord[]; status: 'ok' };
