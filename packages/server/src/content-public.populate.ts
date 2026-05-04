import { basename } from 'node:path';

import type { ContentTypeFieldDefinition } from './content-entries.routes.type.js';
import type { ContentPublicRouteOptions, PublicEntryRecord, PublicMediaRecord } from './content-public.routes.type.js';

type PopulateMode = 'media' | 'relations';

export function parsePopulateParam(value: string | string[] | undefined): readonly PopulateMode[] {
  if (!value) {
    return [];
  }

  const requested = new Set(
    (Array.isArray(value) ? value : value.split(','))
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );

  if (requested.has('*') || requested.has('all')) {
    return ['media', 'relations'] as const;
  }

  return ['media', 'relations'].filter((mode) => requested.has(mode)) as PopulateMode[];
}

export function toPublicEntry(
  entry: { data: Record<string, unknown>; id: string },
  fields: readonly ContentTypeFieldDefinition[],
  options: ContentPublicRouteOptions,
  populate: readonly PopulateMode[],
  preview = false,
): PublicEntryRecord {
  const data: Record<string, unknown> = {};

  for (const field of fields) {
    const value = entry.data[field.key];
    data[field.key] = resolveFieldValue(field, value, options, populate, preview);
  }

  return {
    data,
    id: entry.id,
  };
}

function resolveFieldValue(
  field: ContentTypeFieldDefinition,
  value: unknown,
  options: ContentPublicRouteOptions,
  populate: readonly PopulateMode[],
  preview: boolean,
): unknown {
  if (!populate.length) {
    return value;
  }

  if (field.type === 'media' && populate.includes('media')) {
    return field.repeatable
      ? resolveMany(value, (item) => resolveMedia(String(item), options)).filter(Boolean)
      : resolveMedia(String(value), options);
  }

  if (field.type === 'relation' && populate.includes('relations')) {
    const targetContentTypeId = field.settings?.targetContentTypeId;

    if (!targetContentTypeId) {
      return value;
    }

    return field.repeatable
      ? resolveMany(value, (item) => resolveRelatedEntry(targetContentTypeId, String(item), options, preview)).filter(Boolean)
      : resolveRelatedEntry(targetContentTypeId, String(value), options, preview);
  }

  return value;
}

function resolveMany<T>(value: unknown, resolver: (item: unknown) => T | null): T[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(resolver).filter((item): item is T => item !== null);
}

function resolveRelatedEntry(
  contentTypeId: string,
  entryId: string,
  options: ContentPublicRouteOptions,
  preview: boolean,
): PublicEntryRecord | null {
  const contentType = options.contentTypesRepository.get(contentTypeId);

  if (!contentType) {
    return null;
  }

  const entry = options.contentEntriesRepository.get(contentTypeId, entryId);

  if (!entry || (!preview && entry.status !== 'published')) {
    return null;
  }

  return {
    data: entry.data,
    id: entry.id,
  };
}

function resolveMedia(id: string, options: ContentPublicRouteOptions): PublicMediaRecord | null {
  const media = options.mediaFilesRepository?.get(id);

  if (!media) {
    return null;
  }

  return {
    filename: media.filename,
    id: media.id,
    mimeType: media.mimeType,
    size: media.size,
    url: `/uploads/${basename(media.storagePath)}`,
  };
}
