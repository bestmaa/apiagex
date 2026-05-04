import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

import Database from 'better-sqlite3';

import {
  makeWebhookDeliveryRecord,
  makeWebhookRecord,
  mapWebhookDeliveryRow,
  mapWebhookRow,
  patchWebhookDeliveryRecord,
} from './webhooks.repository.helpers.js';
import { DEFAULT_WEBHOOK_FILTERS } from './webhooks.filters.js';
import { recordSchemaMigration } from './schema-migrations.repository.js';
import {
  createWebhooksSchema,
  ensureWebhookColumns,
  ensureWebhookDeliveryColumns,
} from './webhooks.repository.schema.js';
import type {
  WebhookDeliveryInput,
  WebhookDeliveryPatch,
  WebhookDeliveryRecord,
  WebhookDeliveryRow,
  WebhookInput,
  WebhookRecord,
  WebhookRow,
  WebhooksRepository,
} from './webhooks.repository.type.js';

export function createSqliteWebhooksRepository(databaseFile: string): WebhooksRepository {
  if (databaseFile !== ':memory:') {
    mkdirSync(dirname(databaseFile), { recursive: true });
  }

  const database = new Database(databaseFile);
  database.pragma('journal_mode = WAL');
  database.exec(createWebhooksSchema());
  ensureWebhookColumns(database);
  ensureWebhookDeliveryColumns(database);
  recordSchemaMigration(database, { name: '0001_webhooks_schema_v1', scope: 'webhooks' });

  return {
    clear() {
      database.transaction(() => {
        database.prepare('DELETE FROM webhook_deliveries').run();
        database.prepare('DELETE FROM webhooks').run();
      })();
    },
    close() {
      database.close();
    },
    create(input: WebhookInput): WebhookRecord {
      const record = makeWebhookRecord(input);

      database
        .prepare(
          'INSERT INTO webhooks (id, name, target_url, secret, enabled, events_json, filters_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        )
        .run(
          record.id,
          record.name,
          record.targetUrl,
          record.secret ?? null,
          record.enabled ? 1 : 0,
          JSON.stringify(record.events),
          JSON.stringify(record.filters),
          record.createdAt,
          record.updatedAt,
        );

      return record;
    },
    createDelivery(input: WebhookDeliveryInput): WebhookDeliveryRecord {
      const record = makeWebhookDeliveryRecord(input);

      database
        .prepare(
          'INSERT INTO webhook_deliveries (id, webhook_id, event_name, request_body, attempt, status, status_code, response_body, error_message, next_retry_at, delivered_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        )
        .run(
          record.id,
          record.webhookId,
          record.eventName,
          record.requestBody,
          record.attempt,
          record.status,
          record.statusCode,
          record.responseBody,
          record.errorMessage,
          record.nextRetryAt,
          record.deliveredAt,
          record.createdAt,
          record.updatedAt,
        );

      return record;
    },
    delete(id: string): boolean {
      return database.transaction(() => {
        const result = database.prepare('DELETE FROM webhooks WHERE id = ?').run(id);
        return result.changes > 0;
      })();
    },
    get(id: string): WebhookRecord | null {
      const row = database
        .prepare('SELECT id, name, target_url, secret, enabled, events_json, filters_json, created_at, updated_at FROM webhooks WHERE id = ?')
        .get(id) as WebhookRow | undefined;

      return row ? mapWebhookRow(row) : null;
    },
    getDelivery(id: string): WebhookDeliveryRecord | null {
      const row = database
        .prepare(
          'SELECT id, webhook_id, event_name, request_body, attempt, status, status_code, response_body, error_message, next_retry_at, delivered_at, created_at, updated_at FROM webhook_deliveries WHERE id = ?',
        )
        .get(id) as WebhookDeliveryRow | undefined;

      return row ? mapWebhookDeliveryRow(row) : null;
    },
    list(): readonly WebhookRecord[] {
      const rows = database
        .prepare('SELECT id, name, target_url, secret, enabled, events_json, filters_json, created_at, updated_at FROM webhooks ORDER BY created_at DESC')
        .all() as WebhookRow[];

      return rows.map(mapWebhookRow);
    },
    listDeliveries(webhookId: string): readonly WebhookDeliveryRecord[] {
      const rows = database
        .prepare(
          'SELECT id, webhook_id, event_name, request_body, attempt, status, status_code, response_body, error_message, next_retry_at, delivered_at, created_at, updated_at FROM webhook_deliveries WHERE webhook_id = ? ORDER BY created_at DESC',
        )
        .all(webhookId) as WebhookDeliveryRow[];

      return rows.map(mapWebhookDeliveryRow);
    },
    listPendingDeliveries(): readonly WebhookDeliveryRecord[] {
      const rows = database
        .prepare(
          "SELECT id, webhook_id, event_name, request_body, attempt, status, status_code, response_body, error_message, next_retry_at, delivered_at, created_at, updated_at FROM webhook_deliveries WHERE status IN ('pending', 'retrying') ORDER BY created_at ASC",
        )
        .all() as WebhookDeliveryRow[];

      return rows.map(mapWebhookDeliveryRow);
    },
    listEnabledByEvent(eventName) {
      return this.list().filter((webhook) => webhook.enabled && webhook.events.includes(eventName));
    },
    replaceAll(input) {
      database.transaction(() => {
        database.prepare('DELETE FROM webhook_deliveries').run();
        database.prepare('DELETE FROM webhooks').run();

        for (const webhook of input.webhooks) {
          database
            .prepare(
              'INSERT INTO webhooks (id, name, target_url, secret, enabled, events_json, filters_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            )
            .run(
              webhook.id,
              webhook.name,
              webhook.targetUrl,
              webhook.secret ?? null,
              webhook.enabled ? 1 : 0,
              JSON.stringify(webhook.events),
              JSON.stringify(webhook.filters ?? DEFAULT_WEBHOOK_FILTERS),
              webhook.createdAt,
              webhook.updatedAt,
            );
        }

        for (const delivery of input.deliveries) {
          database
            .prepare(
              'INSERT INTO webhook_deliveries (id, webhook_id, event_name, request_body, attempt, status, status_code, response_body, error_message, next_retry_at, delivered_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            )
            .run(
              delivery.id,
              delivery.webhookId,
              delivery.eventName,
              delivery.requestBody,
              delivery.attempt,
              delivery.status,
              delivery.statusCode,
              delivery.responseBody,
              delivery.errorMessage,
              delivery.nextRetryAt,
              delivery.deliveredAt,
              delivery.createdAt,
              delivery.updatedAt,
            );
        }
      })();
    },
    update(id: string, input: WebhookInput): WebhookRecord | null {
      const existing = this.get(id);

      if (!existing) {
        return null;
      }

      const record = makeWebhookRecord(input, existing);

      database
        .prepare(
          'UPDATE webhooks SET name = ?, target_url = ?, secret = ?, enabled = ?, events_json = ?, filters_json = ?, updated_at = ? WHERE id = ?',
        )
        .run(
          record.name,
          record.targetUrl,
          record.secret ?? null,
          record.enabled ? 1 : 0,
          JSON.stringify(record.events),
          JSON.stringify(record.filters),
          record.updatedAt,
          id,
        );

      return record;
    },
    updateDelivery(id: string, patch: WebhookDeliveryPatch): WebhookDeliveryRecord | null {
      const existing = this.getDelivery(id);

      if (!existing) {
        return null;
      }

      const record = patchWebhookDeliveryRecord(existing, patch);

      database
        .prepare(
          'UPDATE webhook_deliveries SET attempt = ?, status = ?, status_code = ?, response_body = ?, error_message = ?, next_retry_at = ?, delivered_at = ?, updated_at = ? WHERE id = ?',
        )
        .run(
          record.attempt,
          record.status,
          record.statusCode,
          record.responseBody,
          record.errorMessage,
          record.nextRetryAt,
          record.deliveredAt,
          record.updatedAt,
          id,
        );

      return record;
    },
  };
}
