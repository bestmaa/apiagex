import { type EntryRecord, type RealtimeEventType, type SchemaRecord } from "@apiagex/database";
import type { RealtimeBroker } from "./realtime-broker.type.js";

export function emitEntryRealtime(
  broker: RealtimeBroker | undefined,
  schema: SchemaRecord,
  eventType: RealtimeEventType,
  entry: EntryRecord,
): void {
  try {
    broker?.publish({ entry, eventType, schema });
  } catch {
    // Realtime delivery must not make content writes fail.
  }
}
