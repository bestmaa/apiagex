import type { AdminRole } from './auth.type.js';
import type { AuditAction, AuditScope } from './audit.type.js';

export type WebhookEventName = `${AuditScope}.${AuditAction}`;

export interface WebhookEvent {
  action: AuditAction;
  actorEmail: string;
  actorRole: AdminRole;
  createdAt: string;
  details: Record<string, unknown>;
  name: WebhookEventName;
  scope: AuditScope;
  subjectId: string;
}

export interface WebhookEventListener {
  (event: WebhookEvent): void | Promise<void>;
}

export interface WebhookEventBus {
  publish(event: WebhookEvent): void;
  subscribe(listener: WebhookEventListener): () => void;
}
