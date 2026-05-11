import type { WebhookEventType } from "./webhook-repository.type.js";

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
