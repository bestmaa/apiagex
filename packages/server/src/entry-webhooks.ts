import { type EntryRecord, type SchemaRecord, type SqliteDatabase, type WebhookEventType } from "@apiagex/database";
import { emitWebhookEvent } from "./webhook-dispatcher.js";
import type { WebhookDispatcherOptions } from "./webhook-dispatcher.type.js";

export async function emitEntryMutationWebhook(
  database: SqliteDatabase,
  schema: SchemaRecord,
  eventType: WebhookEventType,
  entry: EntryRecord,
  options: WebhookDispatcherOptions,
): Promise<void> {
  try {
    await emitWebhookEvent(database, {
      entry,
      eventType,
      schemaId: schema.id,
      schemaSlug: schema.slug,
    }, options);
  } catch {
    // Webhooks must not make content writes fail.
  }
}
