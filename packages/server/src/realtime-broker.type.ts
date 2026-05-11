import type { EntryRecord, RealtimeEventType, SchemaRecord } from "@apiagex/database";

export type RealtimePublishInput = {
  eventType: RealtimeEventType;
  schema: SchemaRecord;
  entry: EntryRecord;
};

export type RealtimeEventMessage = {
  type: "event";
  event: RealtimeEventType;
  eventId: string;
  messageId: string;
  schema: { id: string; slug: string };
  entry: EntryRecord;
  occurredAt: string;
  delivery: { ackRequired: true; ackTimeoutMs: number };
};

export type RealtimeBroker = {
  publish(input: RealtimePublishInput): void;
  snapshot(): RealtimeConnectionSnapshot[];
};

export type RealtimeConnectionSnapshot = {
  id: string;
  schemaId: string;
  schemaSlug: string;
  connectedAt: string;
  pendingAcks: number;
};
