import type { WebhookDraft } from "@apiagex/database";

export type WebhookBody = WebhookDraft;

export type WebhookParams = {
  webhookId: string;
};
