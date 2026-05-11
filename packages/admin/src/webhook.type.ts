export type WebhookEventType = "entry.created" | "entry.updated" | "entry.deleted";

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

export type WebhookDeliveryRecord = {
  id: string;
  eventId: string;
  webhookId: string;
  url: string;
  status: "failed" | "success";
  statusCode: number | null;
  responseBody: string | null;
  error: string | null;
  attempt: number;
  createdAt: string;
  nextRetryAt: string | null;
};

export type WebhookDraft = {
  name: string;
  url: string;
  secret?: string;
  events: WebhookEventType[];
  schemaId?: string | null;
  active?: boolean;
};

export type WebhookListResponse = {
  ok: boolean;
  webhooks?: WebhookRecord[];
  error?: string;
};

export type WebhookMutationResponse = {
  ok: boolean;
  webhook?: WebhookRecord;
  deleted?: boolean;
  error?: string;
};

export type WebhookDeliveryListResponse = {
  ok: boolean;
  deliveries?: WebhookDeliveryRecord[];
  error?: string;
};
