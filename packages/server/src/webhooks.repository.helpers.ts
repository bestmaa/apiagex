import { randomUUID } from 'node:crypto';

import type {
  WebhookDeliveryInput,
  WebhookDeliveryPatch,
  WebhookDeliveryRecord,
  WebhookDeliveryRow,
  WebhookInput,
  WebhookRecord,
  WebhookRow,
} from './webhooks.repository.type.js';
import { normalizeWebhookFilters } from './webhooks.filters.js';

export function makeWebhookRecord(
  input: WebhookInput,
  existing?: Pick<WebhookRecord, 'createdAt' | 'id'>,
): WebhookRecord {
  const now = new Date().toISOString();

  return {
    ...input,
    filters: normalizeWebhookFilters(input.filters),
    enabled: input.enabled ?? true,
    events: [...new Set(input.events)],
    createdAt: existing?.createdAt ?? now,
    id: existing?.id ?? randomUUID(),
    secret: input.secret?.trim() || undefined,
    updatedAt: now,
  };
}

export function mapWebhookRow(row: WebhookRow): WebhookRecord {
  return {
    createdAt: row.created_at,
    filters: parseFilters(row.filters_json),
    enabled: row.enabled === 1,
    events: parseEvents(row.events_json),
    id: row.id,
    name: row.name,
    secret: row.secret ?? undefined,
    targetUrl: row.target_url,
    updatedAt: row.updated_at,
  };
}

export function makeWebhookDeliveryRecord(input: WebhookDeliveryInput): WebhookDeliveryRecord {
  const now = new Date().toISOString();

  return {
    ...input,
    createdAt: now,
    deliveredAt: input.deliveredAt ?? null,
    errorMessage: input.errorMessage ?? null,
    nextRetryAt: input.nextRetryAt ?? null,
    id: randomUUID(),
    responseBody: input.responseBody ?? null,
    statusCode: input.statusCode ?? null,
    updatedAt: now,
  };
}

export function mapWebhookDeliveryRow(row: WebhookDeliveryRow): WebhookDeliveryRecord {
  return {
    attempt: row.attempt,
    createdAt: row.created_at,
    deliveredAt: row.delivered_at,
    errorMessage: row.error_message,
    eventName: row.event_name as WebhookDeliveryRecord['eventName'],
    id: row.id,
    nextRetryAt: row.next_retry_at,
    requestBody: row.request_body,
    responseBody: row.response_body,
    statusCode: row.status_code,
    status: row.status as WebhookDeliveryRecord['status'],
    webhookId: row.webhook_id,
    updatedAt: row.updated_at,
  };
}

export function patchWebhookDeliveryRecord(
  record: WebhookDeliveryRecord,
  patch: WebhookDeliveryPatch,
): WebhookDeliveryRecord {
  return {
    ...record,
    attempt: patch.attempt ?? record.attempt,
    deliveredAt: patch.deliveredAt ?? record.deliveredAt ?? null,
    errorMessage: patch.errorMessage ?? record.errorMessage ?? null,
    nextRetryAt: patch.nextRetryAt ?? record.nextRetryAt ?? null,
    responseBody: patch.responseBody ?? record.responseBody ?? null,
    status: patch.status ?? record.status,
    statusCode: patch.statusCode ?? record.statusCode ?? null,
    updatedAt: new Date().toISOString(),
  };
}

function parseEvents(value: string): WebhookRecord['events'] {
  try {
    const parsed = JSON.parse(value) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is WebhookRecord['events'][number] => typeof item === 'string');
  } catch {
    return [];
  }
}

function parseFilters(value: string | null): WebhookRecord['filters'] {
  try {
    const parsed = value ? (JSON.parse(value) as unknown) : undefined;

    return normalizeWebhookFilters(
      parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as NonNullable<WebhookRecord['filters']>)
        : undefined,
    );
  } catch {
    return normalizeWebhookFilters(undefined);
  }
}
