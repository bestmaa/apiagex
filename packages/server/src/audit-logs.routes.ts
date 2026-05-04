import type { FastifyInstance } from 'fastify';

import { createAdminOnlyGuard } from './permissions.js';
import type { AuditLogsRouteOptions } from './audit-logs.routes.type.js';

export async function registerAuditLogsRoutes(
  app: FastifyInstance,
  options: AuditLogsRouteOptions,
): Promise<void> {
  app.get('/admin/audit-logs', { preHandler: createAdminOnlyGuard(options.auth) }, async () => ({
    items: options.repository.list(),
    status: 'ok',
  }));
}
