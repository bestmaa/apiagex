import type { EntryRecord } from "./entry-repository.type.js";

export type WebhookEventType = "entry.created" | "entry.updated" | "entry.deleted";

export type WebhookEventStatus = "delivered" | "failed" | "pending";

export type WebhookDeliveryStatus = "failed" | "success";

export type WebhookRecord = {
  id: string;
  name: string;
  url: string;
  events: WebhookEventType[];
  schemaId: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type WebhookSecretRecord = WebhookRecord & {
  secret: string;
};

export type WebhookDraft = {
  name: string;
  url: string;
  secret?: string;
  events: WebhookEventType[];
  schemaId?: string | null;
  active?: boolean;
};

export type WebhookEventRecord = {
  id: string;
  eventType: WebhookEventType;
  schemaId: string;
  schemaSlug: string;
  entryId: string;
  payload: WebhookPayload;
  status: WebhookEventStatus;
  attempts: number;
  nextRetryAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WebhookDeliveryRecord = {
  id: string;
  eventId: string;
  webhookId: string;
  url: string;
  status: WebhookDeliveryStatus;
  statusCode: number | null;
  responseBody: string | null;
  error: string | null;
  attempt: number;
  createdAt: string;
  nextRetryAt: string | null;
};

export type WebhookPayload = {
  event: WebhookEventType;
  schema: { id: string; slug: string };
  entry: EntryRecord;
  occurredAt: string;
};

export type EnqueueWebhookEventInput = {
  eventType: WebhookEventType;
  schemaId: string;
  schemaSlug: string;
  entry: EntryRecord;
};

export type RecordWebhookDeliveryInput = {
  eventId: string;
  webhookId: string;
  url: string;
  status: WebhookDeliveryStatus;
  statusCode?: number | null;
  responseBody?: string | null;
  error?: string | null;
  attempt: number;
  nextRetryAt?: string | null;
};
