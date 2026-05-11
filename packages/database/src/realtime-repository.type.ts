import type { WebhookEventType } from "./webhook-repository.type.js";
import type { EntryRecord } from "./entry-repository.type.js";

export type RealtimeEventType = WebhookEventType;

export type RealtimeConfigRecord = {
  schemaId: string;
  enabled: boolean;
  events: RealtimeEventType[];
  createdAt: string;
  updatedAt: string;
};

export type SetRealtimeConfigInput = {
  schemaId: string;
  enabled: boolean;
  events: RealtimeEventType[];
};

export type RealtimeEventRecord = {
  id: string;
  messageId: string;
  eventType: RealtimeEventType;
  schemaId: string;
  schemaSlug: string;
  entryId: string;
  entry: EntryRecord;
  occurredAt: string;
  createdAt: string;
};

export type RecordRealtimeEventInput = {
  eventType: RealtimeEventType;
  schemaId: string;
  schemaSlug: string;
  entry: EntryRecord;
};
