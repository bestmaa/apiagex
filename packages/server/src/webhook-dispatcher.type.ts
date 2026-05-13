import type { WebhookEventRecord, WebhookSecretRecord } from "apiagex-database";

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
  deliveryId: string;
  headers: Record<string, string>;
  timestamp: string;
  webhook: WebhookSecretRecord;
};

export type WebhookVerificationInput = {
  body: string;
  deliveryId: string;
  signature: string;
  timestamp: string;
  secret: string;
  toleranceSeconds?: number;
  now?: Date;
};
