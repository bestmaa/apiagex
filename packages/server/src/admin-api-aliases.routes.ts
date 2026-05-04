import type { FastifyInstance, FastifyReply, FastifyRequest, InjectOptions } from 'fastify';

const ALIASES = [
  ['/api/health/detail', '/health/detail'],
  ['/api/audit-logs', '/admin/audit-logs'],
  ['/api/backups/export', '/admin/backups/export'],
  ['/api/backups/restore', '/admin/backups/restore'],
  ['/api/content-types', '/admin/content-types'],
  ['/api/media-files', '/admin/media-files'],
  ['/api/migrations', '/admin/migrations'],
  ['/api/roles', '/admin/roles'],
  ['/api/search', '/admin/search'],
  ['/api/webhooks', '/admin/webhooks'],
] as const;

export async function registerAdminApiAliases(app: FastifyInstance): Promise<void> {
  for (const [source, target] of ALIASES) {
    app.all(source, async (request, reply) => forward(app, request, reply, source, target));
    app.all(`${source}/*`, async (request, reply) => forward(app, request, reply, source, target));
  }
}

async function forward(
  app: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
  source: string,
  target: string,
): Promise<FastifyReply> {
  const requestUrl = new URL(request.url, 'http://apiagex.local');
  const path = `${target}${requestUrl.pathname.slice(source.length)}${requestUrl.search}`;
  const injectOptions: InjectOptions = {
    headers: request.headers,
    method: request.method as NonNullable<InjectOptions['method']>,
    url: path,
  };
  if (hasBody(request.method) && request.body !== undefined) {
    injectOptions.payload = request.body as NonNullable<InjectOptions['payload']>;
  }
  const response = await app.inject(injectOptions);

  for (const [key, value] of Object.entries(response.headers)) {
    if (value !== undefined && key.toLowerCase() !== 'content-length') {
      reply.header(key, value);
    }
  }

  return reply.code(response.statusCode).send(response.payload);
}

function hasBody(method: string): boolean {
  return !['GET', 'HEAD'].includes(method.toUpperCase());
}
