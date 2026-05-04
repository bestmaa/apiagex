import type { ContentTypesRepository } from './content-types.repository.type.js';
import type { WebhookEvent } from './webhooks.events.type.js';

export type RealtimeAction = 'create' | 'delete' | 'update';

export interface RealtimeActionState {
  create: boolean;
  delete: boolean;
  update: boolean;
}

export interface RealtimeMessage {
  action: string;
  contentTypeId: string;
  contentTypeSlug: string;
  createdAt: string;
  details: Record<string, unknown>;
  name: string;
  scope: string;
  subjectId: string;
  targets: readonly string[];
}

export interface RealtimeStreamManager {
  close(): void;
  connect(types: readonly string[], send: (chunk: string) => void): () => void;
  publish(event: WebhookEvent, contentTypes: Pick<ContentTypesRepository, 'get'>): void;
}
