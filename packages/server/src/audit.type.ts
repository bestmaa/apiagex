import type { AdminRole } from './auth.type.js';

export type AuditAction = 'create' | 'update' | 'delete';
export type AuditScope = 'content-types' | 'content-fields' | 'content-entries' | 'media-files';

export interface AuditLogInput {
  action: AuditAction;
  actorEmail: string;
  actorRole: AdminRole;
  details: Record<string, unknown>;
  scope: AuditScope;
  subjectId: string;
}

export interface AuditLogRecord extends AuditLogInput {
  createdAt: string;
  id: string;
}

export interface AuditLogRepository {
  append(input: AuditLogInput): AuditLogRecord;
  clear(): void;
  close(): void;
  list(): readonly AuditLogRecord[];
  replaceAll(records: readonly AuditLogRecord[]): void;
}
