import type { FastifyInstance } from 'fastify';

import { requireAdminToken } from './auth.js';
import { exportBackupBundle, restoreBackupBundle } from './backup.service.js';
import type { BackupRoutesOptions } from './backup.routes.type.js';

export async function registerBackupRoutes(app: FastifyInstance, options: BackupRoutesOptions): Promise<void> {
  app.get('/admin/backups/export', async (request, reply) => {
    if (!requireAdminToken(options.auth, request.headers.authorization)) {
      return reply.code(401).send({ message: 'Authentication required' });
    }

    const bundle = exportBackupBundle(options);
    reply.header('content-type', 'application/json');
    reply.header('content-disposition', 'attachment; filename="apiagex-backup.json"');
    return bundle;
  });

  app.post('/admin/backups/restore', async (request, reply) => {
    if (!requireAdminToken(options.auth, request.headers.authorization)) {
      return reply.code(401).send({ message: 'Authentication required' });
    }

    const bundle = request.body as Parameters<typeof restoreBackupBundle>[1];

    if (!bundle || bundle.version !== 1) {
      return reply.code(400).send({ message: 'Invalid backup bundle' });
    }

    const summary = restoreBackupBundle(options, bundle);
    options.onRestored?.();
    return reply.send({ status: 'ok', summary });
  });

  app.get('/admin/migrations', async (request, reply) => {
    if (!requireAdminToken(options.auth, request.headers.authorization)) {
      return reply.code(401).send({ message: 'Authentication required' });
    }

    return {
      items: options.schemaMigrationsRepository.list(),
      status: 'ok',
    };
  });
}
