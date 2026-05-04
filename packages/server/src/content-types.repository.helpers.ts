import type Database from 'better-sqlite3';

import { normalizeContentTypePermissions } from './content-type-permissions.js';
import type { ContentFieldRow, ContentTypeInput, ContentTypeRecord } from './content-types.repository.type.js';
import type {
  ContentTypeFieldInput,
  ContentTypeFieldSettings,
  ContentTypePermissionsInput,
  ContentTypePermissions,
  ContentTypeRealtimeActions,
  ContentTypeRealtimeActionsInput,
} from './content-types.routes.type.js';

export function makeContentTypeRecord(input: ContentTypeInput): ContentTypeRecord {
  const realtimeEnabled = Boolean(input.realtimeEnabled);

  return {
    ...input,
    permissions: normalizeContentTypePermissions(input.permissions),
    realtimeActions: normalizeRealtimeActions(input.realtimeActions, realtimeEnabled),
    realtimeEnabled,
    id: input.slug,
  };
}

export function makeFieldRecord(contentTypeId: string, input: ContentTypeFieldInput) {
  return {
    ...input,
    contentTypeId,
    id: `${contentTypeId}:${input.key}`,
  };
}

export function mapContentTypeRow(
  database: Database.Database,
  row: {
    display_name: string;
    id: string;
    kind: string;
    permissions_json: string | null;
    realtime_create_enabled: number | null;
    realtime_delete_enabled: number | null;
    realtime_enabled: number;
    realtime_update_enabled: number | null;
    slug: string;
  },
): ContentTypeRecord {
  const realtimeEnabled = row.realtime_enabled === 1;

  return {
    displayName: row.display_name,
    fields: listContentFields(database, row.id),
    id: row.id,
    kind: row.kind as ContentTypeRecord['kind'],
    permissions: parsePermissions(row.permissions_json),
    realtimeActions: {
      create: readStoredRealtimeAction(row.realtime_create_enabled, realtimeEnabled),
      delete: readStoredRealtimeAction(row.realtime_delete_enabled, realtimeEnabled),
      update: readStoredRealtimeAction(row.realtime_update_enabled, realtimeEnabled),
    },
    realtimeEnabled,
    slug: row.slug,
  };
}

export function mapFieldRow(row: ContentFieldRow) {
  return {
    contentTypeId: row.content_type_id,
    id: `${row.content_type_id}:${row.field_key}`,
    key: row.field_key,
    label: row.label,
    required: row.required === 1,
    repeatable: row.repeatable === 1,
    settings: parseSettings(row.settings_json),
    sortOrder: row.sort_order,
    type: row.type as ContentTypeFieldInput['type'],
  };
}

export function listContentFields(
  database: Database.Database,
  contentTypeId: string,
): readonly ReturnType<typeof mapFieldRow>[] {
  const rows = database
    .prepare(
      'SELECT content_type_id, field_key, label, type, required, repeatable, sort_order, settings_json FROM content_fields WHERE content_type_id = ? ORDER BY sort_order ASC',
    )
    .all(contentTypeId) as ContentFieldRow[];

  return rows.map(mapFieldRow);
}

function parseSettings(value: string): ContentTypeFieldSettings {
  try {
    const parsed = JSON.parse(value) as ContentTypeFieldSettings | null;

    if (!parsed || typeof parsed !== 'object' || typeof parsed.targetContentTypeId !== 'string') {
      return {};
    }

    return { targetContentTypeId: parsed.targetContentTypeId };
  } catch {
    return {};
  }
}

function parsePermissions(value: string | null): ContentTypePermissions {
  try {
    const parsed = value ? (JSON.parse(value) as ContentTypePermissionsInput | null) : undefined;

    return normalizeContentTypePermissions(parsed ?? undefined);
  } catch {
    return normalizeContentTypePermissions(undefined);
  }
}

export function normalizeRealtimeActions(
  input: ContentTypeRealtimeActionsInput | undefined,
  fallback: boolean,
): ContentTypeRealtimeActions {
  return {
    create: normalizeRealtimeAction(input?.create, fallback),
    delete: normalizeRealtimeAction(input?.delete, fallback),
    update: normalizeRealtimeAction(input?.update, fallback),
  };
}

function normalizeRealtimeAction(value: boolean | undefined, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function readStoredRealtimeAction(value: number | null, fallback: boolean): boolean {
  return value === null ? fallback : value === 1;
}
