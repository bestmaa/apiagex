import type {
  WebhookDeliveryListResponse,
  WebhookDraft,
  WebhookListResponse,
  WebhookMutationResponse,
} from "./webhook.type";
import { adminJson } from "./api";

export async function listWebhooks(): Promise<WebhookListResponse> {
  return adminJson<WebhookListResponse>("/api/admin/webhooks");
}

export async function createWebhook(input: WebhookDraft): Promise<WebhookMutationResponse> {
  return adminJson<WebhookMutationResponse>("/api/admin/webhooks", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function updateWebhook(
  webhookId: string,
  input: WebhookDraft,
): Promise<WebhookMutationResponse> {
  return adminJson<WebhookMutationResponse>(`/api/admin/webhooks/${webhookId}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function deleteWebhook(webhookId: string): Promise<WebhookMutationResponse> {
  return adminJson<WebhookMutationResponse>(`/api/admin/webhooks/${webhookId}`, { method: "DELETE" });
}

export async function listWebhookDeliveries(webhookId: string): Promise<WebhookDeliveryListResponse> {
  return adminJson<WebhookDeliveryListResponse>(`/api/admin/webhooks/${webhookId}/deliveries`);
}
