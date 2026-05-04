import { basename } from 'node:path';

import type { FastifyInstance } from 'fastify';

import { requireAdminToken } from './auth.js';
import type { AdminRole } from './auth.type.js';
import { canAccessContentTypeWithRoleCatalog } from './content-role-access.js';
import { canAccess } from './permissions.js';
import type { ContentEntryRecord } from './content-entries.routes.type.js';
import type { SearchRoutesOptions, SearchResultItem } from './search.routes.type.js';

export async function registerSearchRoutes(app: FastifyInstance, options: SearchRoutesOptions): Promise<void> {
  app.get('/admin/search', async (request, reply) => {
    const session = requireAdminToken(options.auth, request.headers.authorization);

    if (!session) {
      return reply.code(401).send({ message: 'Authentication required' });
    }

    const query = normalizeQuery((request.query as { q?: string | undefined }).q);

    if (!query) {
      return { items: [], query: '', status: 'ok' };
    }

    return {
      items: searchItems(options, query, session.role).slice(0, 25),
      query,
      status: 'ok',
    };
  });
}

function searchItems(options: SearchRoutesOptions, query: string, role: AdminRole): readonly SearchResultItem[] {
  const items: Array<SearchResultItem & { score: number }> = [];

  for (const contentType of options.contentTypesRepository.list()) {
    if (
      !canAccessContentTypeWithRoleCatalog(
        options.rolesRepository,
        contentType.id,
        contentType.permissions,
        'list',
        role,
      )
    ) {
      continue;
    }

    const contentTypeScore = scoreText(
      [contentType.displayName, contentType.slug, contentType.kind, ...contentType.fields.flatMap((field) => [
        field.key,
        field.label,
        field.type,
        field.settings?.targetContentTypeId ?? '',
      ])],
      query,
    );

    if (contentTypeScore) {
      items.push({
        contentTypeId: contentType.id,
        contentTypeSlug: contentType.slug,
        detail: `${contentType.kind} · ${contentType.fields.length} field(s)`,
        id: contentType.id,
        kind: 'content-type',
        score: contentTypeScore,
        subtitle: contentType.slug,
        title: contentType.displayName,
      });
    }

    for (const entry of options.contentEntriesRepository.list(contentType.id)) {
      const score = scoreText(
        [
          entry.id,
          entry.status,
          entry.publishAt ?? '',
          contentType.displayName,
          contentType.slug,
          stringify(entry.data),
          summarizeEntry(entry, contentType.fields),
        ],
        query,
      );

      if (!score) {
        continue;
      }

      items.push({
        contentTypeId: contentType.id,
        contentTypeSlug: contentType.slug,
        detail: `${entry.status}${entry.publishAt ? ` · ${entry.publishAt}` : ''}`,
        entryId: entry.id,
        id: entry.id,
        kind: 'entry',
        score,
        subtitle: contentType.displayName,
        title: summarizeEntry(entry, contentType.fields),
      });
    }
  }

  if (canAccess(role, 'media-files', 'read')) {
    for (const file of options.mediaFilesRepository.list()) {
      const score = scoreText([file.id, file.filename, file.mimeType, file.storagePath], query);

      if (!score) {
        continue;
      }

      items.push({
        detail: `${file.mimeType} · ${formatBytes(file.size)}`,
        id: file.id,
        kind: 'media',
        mediaUrl: `/uploads/${basename(file.storagePath)}`,
        score,
        subtitle: file.id,
        title: file.filename,
      });
    }
  }

  return items
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title))
    .map(({ score: _score, ...item }) => item);
}

function summarizeEntry(
  entry: ContentEntryRecord,
  fields: readonly { key: string; label: string }[],
): string {
  const preferredKeys = ['title', 'name', 'label', 'headline', 'slug'];

  for (const key of preferredKeys) {
    const value = entry.data[key];

    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  for (const field of fields) {
    const value = entry.data[field.key];

    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  const extracted = extractText(entry.data).find(Boolean);

  return extracted ?? entry.id;
}

function scoreText(values: readonly string[], query: string): number {
  let score = 0;

  for (const value of values) {
    score = Math.max(score, scoreValue(value, query));
  }

  return score;
}

function scoreValue(value: string | undefined, query: string): number {
  const normalized = normalizeQuery(value);

  if (!normalized) {
    return 0;
  }

  if (normalized === query) {
    return 100;
  }

  if (normalized.startsWith(query)) {
    return 90;
  }

  const index = normalized.indexOf(query);

  return index >= 0 ? 70 - Math.min(index, 20) : 0;
}

function extractText(value: unknown): string[] {
  if (value === null || value === undefined) {
    return [];
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return [String(value)];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => extractText(item));
  }

  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).flatMap((item) => extractText(item));
  }

  return [];
}

function stringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
}

function formatBytes(size: number): string {
  if (!Number.isFinite(size) || size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${Math.round(size / 102.4) / 10} KB`;
  }

  return `${Math.round(size / 102.4 / 1024) / 10} MB`;
}

function normalizeQuery(value: string | undefined): string {
  return value?.trim().toLowerCase() ?? '';
}
