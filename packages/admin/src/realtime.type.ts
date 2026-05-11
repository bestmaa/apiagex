import type { SchemaRecord } from "./schema.type";
import type { WebhookEventType } from "./webhook.type";

export type RealtimeEventType = WebhookEventType;

export type RealtimeConfigRecord = {
  schemaId: string;
  enabled: boolean;
  events: RealtimeEventType[];
  createdAt: string;
  updatedAt: string;
};

export type RealtimeConnectionRecord = {
  id: string;
  schemaId: string;
  schemaSlug: string;
  connectedAt: string;
  pendingAcks: number;
};

export type RealtimeEventRecord = {
  id: string;
  messageId: string;
  eventType: RealtimeEventType;
  schemaId: string;
  schemaSlug: string;
  entryId: string;
  entry: { data?: Record<string, unknown> };
  occurredAt: string;
  createdAt: string;
};

export type RealtimeListResponse = {
  ok: boolean;
  configs?: RealtimeConfigRecord[];
  connections?: RealtimeConnectionRecord[];
  events?: RealtimeEventRecord[];
  retention?: { eventsPerSchema: number };
  schemas?: SchemaRecord[];
  error?: string;
};

export type RealtimeMutationResponse = {
  ok: boolean;
  config?: RealtimeConfigRecord;
  error?: string;
};
