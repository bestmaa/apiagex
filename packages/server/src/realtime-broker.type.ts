import type { EntryRecord, RealtimeEventRecord, RealtimeEventType, SchemaRecord } from "@apiagex/database";

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
  replayed?: true;
};

export type RealtimeBroker = {
  publish(input: RealtimePublishInput): void;
  retentionEventsPerSchema: number;
  snapshot(): RealtimeConnectionSnapshot[];
};

export type RealtimeStoredEvent = RealtimeEventRecord;

export type RealtimeConnectionSnapshot = {
  id: string;
  schemaId: string;
  schemaSlug: string;
  connectedAt: string;
  pendingAcks: number;
};
