import type { AdminAuthService } from './auth.type.js';
import type { AuditLogRepository } from './audit.type.js';

export interface AuditLogsRouteOptions {
  auth: AdminAuthService;
  repository: AuditLogRepository;
}
