import type { WebhookEvent } from './webhooks.events.type.js';

export type WebhookFilterAction = 'create' | 'delete' | 'list' | 'read' | 'update';

export interface WebhookFiltersInput {
  actions?: readonly WebhookFilterAction[];
  contentTypeIds?: readonly string[];
}

export interface WebhookFilters {
  actions: readonly WebhookFilterAction[];
  contentTypeIds: readonly string[];
}

export const DEFAULT_WEBHOOK_FILTERS: WebhookFilters = {
  actions: [],
  contentTypeIds: [],
};

const FILTER_ACTIONS = new Set<WebhookFilterAction>(['create', 'delete', 'list', 'read', 'update']);

export function normalizeWebhookFilters(input: WebhookFiltersInput | undefined): WebhookFilters {
  if (typeof input === 'undefined') {
    return DEFAULT_WEBHOOK_FILTERS;
  }

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return DEFAULT_WEBHOOK_FILTERS;
  }

  return {
    actions: normalizeActionList(input.actions),
    contentTypeIds: normalizeTextList(input.contentTypeIds),
  };
}

export function parseWebhookFilters(value: unknown): WebhookFilters | null {
  if (typeof value === 'undefined') {
    return DEFAULT_WEBHOOK_FILTERS;
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const input = value as WebhookFiltersInput;
  if (typeof input.actions !== 'undefined' && !Array.isArray(input.actions)) {
    return null;
  }

  if (typeof input.contentTypeIds !== 'undefined' && !Array.isArray(input.contentTypeIds)) {
    return null;
  }

  if (typeof input.actions !== 'undefined' && !isValidActionList(input.actions)) {
    return null;
  }

  if (typeof input.contentTypeIds !== 'undefined' && !isValidTextList(input.contentTypeIds)) {
    return null;
  }

  const actions = normalizeActionList(input.actions);
  const contentTypeIds = normalizeTextList(input.contentTypeIds);

  return {
    actions,
    contentTypeIds,
  };
}

export function matchesWebhookFilters(filters: WebhookFilters, event: WebhookEvent): boolean {
  if (filters.contentTypeIds.length > 0) {
    const contentTypeId = extractContentTypeId(event);

    if (!contentTypeId || !filters.contentTypeIds.includes(contentTypeId)) {
      return false;
    }
  }

  if (filters.actions.length > 0 && !filters.actions.includes(event.action as WebhookFilterAction)) {
    return false;
  }

  return true;
}

function extractContentTypeId(event: WebhookEvent): string {
  const details = event.details ?? {};
  const candidates = [
    typeof details.contentTypeId === 'string' ? details.contentTypeId : '',
    typeof details.contentTypeSlug === 'string' ? details.contentTypeSlug : '',
  ];

  return candidates.find((value) => value.length > 0) ?? '';
}

function normalizeActionList(value: readonly string[] | readonly WebhookFilterAction[] | undefined): readonly WebhookFilterAction[] {
  if (!value) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .filter((item): item is WebhookFilterAction => typeof item === 'string' && FILTER_ACTIONS.has(item as WebhookFilterAction))
        .map((item) => item as WebhookFilterAction),
    ),
  );
}

function normalizeTextList(value: readonly string[] | undefined): readonly string[] {
  if (!value) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
    ),
  );
}

function isValidActionList(value: readonly unknown[]): boolean {
  return value.every((item) => typeof item === 'string' && FILTER_ACTIONS.has(item as WebhookFilterAction));
}

function isValidTextList(value: readonly unknown[]): boolean {
  return value.every((item) => typeof item === 'string');
}
