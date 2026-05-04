import { requireAdminToken } from './auth.js';
import type { AdminAuthService } from './auth.type.js';
import type { AuditAction, AuditLogRepository, AuditScope } from './audit.type.js';
import { createWebhookEventName } from './webhooks.events.js';
import type { WebhookEventBus } from './webhooks.events.type.js';

export function recordAudit(
  auth: AdminAuthService,
  repository: AuditLogRepository,
  authorizationHeader: string | undefined,
  scope: AuditScope,
  action: AuditAction,
  subjectId: string,
  details: Record<string, unknown> = {},
  eventBus?: WebhookEventBus,
): void {
  const session = requireAdminToken(auth, authorizationHeader);

  if (!session) {
    return;
  }

  repository.append({
    action,
    actorEmail: session.email,
    actorRole: session.role,
    details,
    scope,
    subjectId,
  });

  eventBus?.publish({
    action,
    actorEmail: session.email,
    actorRole: session.role,
    createdAt: new Date().toISOString(),
    details,
    name: createWebhookEventName(scope, action),
    scope,
    subjectId,
  });
}

export function recordSystemAudit(
  repository: AuditLogRepository,
  scope: AuditScope,
  action: AuditAction,
  subjectId: string,
  details: Record<string, unknown> = {},
  eventBus?: WebhookEventBus,
): void {
  repository.append({
    action,
    actorEmail: 'system@apiagex.local',
    actorRole: 'admin',
    details,
    scope,
    subjectId,
  });

  eventBus?.publish({
    action,
    actorEmail: 'system@apiagex.local',
    actorRole: 'admin',
    createdAt: new Date().toISOString(),
    details,
    name: createWebhookEventName(scope, action),
    scope,
    subjectId,
  });
}
