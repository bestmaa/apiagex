import type {
  WebhookDeliveryListResponse,
  WebhookDraft,
  WebhookListResponse,
  WebhookMutationResponse,
} from "./webhook.type";

export async function listWebhooks(): Promise<WebhookListResponse> {
  const response = await fetch("/api/admin/webhooks");
  return (await response.json()) as WebhookListResponse;
}

export async function createWebhook(input: WebhookDraft): Promise<WebhookMutationResponse> {
  const response = await fetch("/api/admin/webhooks", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  return (await response.json()) as WebhookMutationResponse;
}

export async function updateWebhook(
  webhookId: string,
  input: WebhookDraft,
): Promise<WebhookMutationResponse> {
  const response = await fetch(`/api/admin/webhooks/${webhookId}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  return (await response.json()) as WebhookMutationResponse;
}

export async function deleteWebhook(webhookId: string): Promise<WebhookMutationResponse> {
  const response = await fetch(`/api/admin/webhooks/${webhookId}`, { method: "DELETE" });
  return (await response.json()) as WebhookMutationResponse;
}

export async function listWebhookDeliveries(webhookId: string): Promise<WebhookDeliveryListResponse> {
  const response = await fetch(`/api/admin/webhooks/${webhookId}/deliveries`);
  return (await response.json()) as WebhookDeliveryListResponse;
}
