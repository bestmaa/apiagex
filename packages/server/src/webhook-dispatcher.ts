import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import {
  countWebhookDeliveryAttempts,
  enqueueWebhookEvent,
  hasSuccessfulWebhookDelivery,
  listMatchingWebhooks,
  listPendingWebhookEvents,
  recordWebhookDelivery,
  updateWebhookEventStatus,
  type ApiagexDatabase,
  type EnqueueWebhookEventInput,
  type WebhookEventRecord,
  type WebhookSecretRecord,
} from "@apiagex/database";
import type {
  WebhookDispatchResult,
  WebhookDispatcherOptions,
  WebhookHttpClient,
  WebhookSignedRequest,
  WebhookVerificationInput,
} from "./webhook-dispatcher.type.js";

const maxAttempts = 5;
const retrySeconds = [60, 300, 900, 3600, 10800];

export async function emitWebhookEvent(
  database: ApiagexDatabase,
  input: EnqueueWebhookEventInput,
  options: WebhookDispatcherOptions = {},
): Promise<WebhookDispatchResult[]> {
  await enqueueWebhookEvent(database, input);
  return dispatchPendingWebhooks(database, options);
}

export async function dispatchPendingWebhooks(
  database: ApiagexDatabase,
  options: WebhookDispatcherOptions = {},
): Promise<WebhookDispatchResult[]> {
  const now = options.now ?? new Date();
  const events = await listPendingWebhookEvents(database, now.toISOString(), options.limit);
  const results: WebhookDispatchResult[] = [];
  for (const event of events) {
    results.push(await dispatchEvent(database, event, options.httpClient ?? fetchWebhook, now));
  }
  return results;
}

export function signWebhookRequest(
  event: WebhookEventRecord,
  webhook: WebhookSecretRecord,
  deliveryId = `whd_${randomUUID()}`,
  timestamp = new Date().toISOString(),
): WebhookSignedRequest {
  const body = JSON.stringify(event.payload);
  const signature = webhookSignature(webhook.secret, timestamp, deliveryId, body);
  return {
    body,
    deliveryId,
    headers: {
      "content-type": "application/json",
      "x-apiagex-delivery-id": deliveryId,
      "x-apiagex-event": event.eventType,
      "x-apiagex-signature": `sha256=${signature}`,
      "x-apiagex-timestamp": timestamp,
      "x-apiagex-webhook-id": webhook.id,
    },
    timestamp,
    webhook,
  };
}

export function verifyWebhookSignature(input: WebhookVerificationInput): boolean {
  if (!input.deliveryId || !input.timestamp || !input.signature.startsWith("sha256=")) return false;
  const timestampMs = Date.parse(input.timestamp);
  if (Number.isNaN(timestampMs)) return false;
  const now = input.now ?? new Date();
  const tolerance = (input.toleranceSeconds ?? 300) * 1000;
  if (Math.abs(now.getTime() - timestampMs) > tolerance) return false;
  const expected = `sha256=${webhookSignature(input.secret, input.timestamp, input.deliveryId, input.body)}`;
  return safeEqual(expected, input.signature);
}

async function dispatchEvent(
  database: ApiagexDatabase,
  event: WebhookEventRecord,
  httpClient: WebhookHttpClient,
  now: Date,
): Promise<WebhookDispatchResult> {
  const webhooks = await listMatchingWebhooks(database, event);
  if (webhooks.length === 0) {
    await updateWebhookEventStatus(database, event.id, "delivered", event.attempts, null);
    return { event, delivered: 0, failed: 0, skipped: 0 };
  }
  let delivered = 0;
  let failed = 0;
  let skipped = 0;
  let nextRetryAt: string | null = null;
  for (const webhook of webhooks) {
    if (await hasSuccessfulWebhookDelivery(database, event.id, webhook.id)) {
      skipped += 1;
      continue;
    }
    const attempts = await countWebhookDeliveryAttempts(database, event.id, webhook.id);
    if (attempts >= maxAttempts) {
      failed += 1;
      continue;
    }
    const result = await deliverOne(database, event, webhook, httpClient, attempts + 1, now);
    delivered += result === "success" ? 1 : 0;
    failed += result === "failed" ? 1 : 0;
    if (result !== "success" && attempts + 1 < maxAttempts) {
      nextRetryAt = earliestRetry(nextRetryAt, retryAt(now, attempts + 1));
    }
  }
  const attemptCount = await maxAttemptsForEvent(database, event.id, webhooks);
  const eventStatus = failed > 0 ? (nextRetryAt ? "pending" : "failed") : "delivered";
  await updateWebhookEventStatus(database, event.id, eventStatus, attemptCount, nextRetryAt);
  return { event, delivered, failed, skipped };
}

async function deliverOne(
  database: ApiagexDatabase,
  event: WebhookEventRecord,
  webhook: WebhookSecretRecord,
  httpClient: WebhookHttpClient,
  attempt: number,
  now: Date,
): Promise<"failed" | "success"> {
  const deliveryId = `whd_${randomUUID()}`;
  const signed = signWebhookRequest(event, webhook, deliveryId, now.toISOString());
  try {
    const response = await httpClient({ url: webhook.url, body: signed.body, headers: signed.headers });
    const ok = response.statusCode >= 200 && response.statusCode < 300;
    await recordWebhookDelivery(database, {
      id: deliveryId,
      eventId: event.id,
      webhookId: webhook.id,
      url: webhook.url,
      status: ok ? "success" : "failed",
      statusCode: response.statusCode,
      responseBody: response.body,
      attempt,
      nextRetryAt: ok || attempt >= maxAttempts ? null : retryAt(now, attempt),
    });
    return ok ? "success" : "failed";
  } catch (error) {
    await recordWebhookDelivery(database, {
      id: deliveryId,
      eventId: event.id,
      webhookId: webhook.id,
      url: webhook.url,
      status: "failed",
      error: error instanceof Error ? error.message : "WEBHOOK_DELIVERY_FAILED",
      attempt,
      nextRetryAt: attempt >= maxAttempts ? null : retryAt(now, attempt),
    });
    return "failed";
  }
}

async function fetchWebhook(request: Parameters<WebhookHttpClient>[0]): Promise<{ statusCode: number; body: string }> {
  const response = await fetch(request.url, { body: request.body, headers: request.headers, method: "POST" });
  return { statusCode: response.status, body: await response.text() };
}

function retryAt(now: Date, attempt: number): string {
  const seconds = retrySeconds[Math.min(attempt - 1, retrySeconds.length - 1)] ?? 60;
  return new Date(now.getTime() + seconds * 1000).toISOString();
}

function earliestRetry(current: string | null, next: string): string {
  return !current || next < current ? next : current;
}

async function maxAttemptsForEvent(
  database: ApiagexDatabase,
  eventId: string,
  webhooks: WebhookSecretRecord[],
): Promise<number> {
  const attempts = await Promise.all(webhooks.map((webhook) => countWebhookDeliveryAttempts(database, eventId, webhook.id)));
  return Math.max(0, ...attempts);
}

function webhookSignature(secret: string, timestamp: string, deliveryId: string, body: string): string {
  return createHmac("sha256", secret).update(`${timestamp}.${deliveryId}.${body}`).digest("hex");
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}
