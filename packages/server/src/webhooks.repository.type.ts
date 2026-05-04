import type { WebhookFilters, WebhookFiltersInput } from './webhooks.filters.js';
import type { WebhookEventName } from './webhooks.events.type.js';

export interface WebhookInput {
  filters?: WebhookFiltersInput;
  enabled?: boolean;
  events: readonly WebhookEventName[];
  name: string;
  secret?: string | undefined;
  targetUrl: string;
}

export interface WebhookRecord extends WebhookInput {
  createdAt: string;
  id: string;
  updatedAt: string;
  filters: WebhookFilters;
}

export interface WebhookDeliveryInput {
  errorMessage?: string | null;
  eventName: WebhookEventName;
  attempt: number;
  status: WebhookDeliveryStatus;
  deliveredAt?: string | null;
  requestBody: string;
  nextRetryAt?: string | null;
  responseBody?: string | null;
  statusCode?: number | null;
  webhookId: string;
}

export interface WebhookDeliveryRecord extends WebhookDeliveryInput {
  createdAt: string;
  id: string;
  updatedAt: string;
}

export interface WebhookDeliveryPatch {
  attempt?: number;
  deliveredAt?: string | null;
  errorMessage?: string | null;
  nextRetryAt?: string | null;
  responseBody?: string | null;
  status?: WebhookDeliveryStatus;
  statusCode?: number | null;
}

export interface WebhookRow {
  created_at: string;
  filters_json: string | null;
  enabled: number;
  events_json: string;
  id: string;
  name: string;
  secret: string | null;
  target_url: string;
  updated_at: string;
}

export interface WebhookDeliveryRow {
  attempt: number;
  delivered_at: string | null;
  created_at: string;
  error_message: string | null;
  event_name: string;
  id: string;
  next_retry_at: string | null;
  request_body: string;
  response_body: string | null;
  status_code: number | null;
  status: string;
  webhook_id: string;
  updated_at: string;
}

export interface WebhooksRepository {
  clear(): void;
  close(): void;
  create(input: WebhookInput): WebhookRecord;
  createDelivery(input: WebhookDeliveryInput): WebhookDeliveryRecord;
  delete(id: string): boolean;
  get(id: string): WebhookRecord | null;
  getDelivery(id: string): WebhookDeliveryRecord | null;
  list(): readonly WebhookRecord[];
  listDeliveries(webhookId: string): readonly WebhookDeliveryRecord[];
  listEnabledByEvent(eventName: WebhookEventName): readonly WebhookRecord[];
  listPendingDeliveries(): readonly WebhookDeliveryRecord[];
  replaceAll(input: { deliveries: readonly WebhookDeliveryRecord[]; webhooks: readonly WebhookRecord[] }): void;
  update(id: string, input: WebhookInput): WebhookRecord | null;
  updateDelivery(id: string, patch: WebhookDeliveryPatch): WebhookDeliveryRecord | null;
}

export type WebhookDeliveryStatus = 'delivered' | 'failed' | 'pending' | 'retrying';
