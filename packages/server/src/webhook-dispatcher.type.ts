import type { WebhookEventRecord, WebhookSecretRecord } from "@apiagex/database";

export type WebhookHttpRequest = {
  url: string;
  body: string;
  headers: Record<string, string>;
};

export type WebhookHttpResponse = {
  statusCode: number;
  body: string;
};

export type WebhookHttpClient = (request: WebhookHttpRequest) => Promise<WebhookHttpResponse>;

export type WebhookDispatcherOptions = {
  httpClient?: WebhookHttpClient;
  limit?: number;
  now?: Date;
};

export type WebhookDispatchResult = {
  event: WebhookEventRecord;
  delivered: number;
  failed: number;
  skipped: number;
};

export type WebhookSignedRequest = {
  body: string;
  headers: Record<string, string>;
  webhook: WebhookSecretRecord;
};
