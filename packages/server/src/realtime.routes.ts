import type { FastifyInstance } from 'fastify';

import type { RealtimeRouteOptions } from './realtime.routes.type.js';

export async function registerRealtimeRoutes(app: FastifyInstance, options: RealtimeRouteOptions): Promise<void> {
  app.get('/realtime/stream', async (request, reply) => {
    const types = parseTypes(request.query as { contentTypes?: string | string[]; types?: string | string[] });

    reply.hijack();
    reply.raw.statusCode = 200;
    reply.raw.setHeader('cache-control', 'no-cache, no-transform');
    reply.raw.setHeader('connection', 'keep-alive');
    reply.raw.setHeader('content-type', 'text/event-stream; charset=utf-8');
    reply.raw.setHeader('x-accel-buffering', 'no');

    const disconnect = options.manager.connect(types, (chunk) => {
      reply.raw.write(chunk);
    });

    const heartbeat = setInterval(() => {
      reply.raw.write(formatSse('ping', { now: new Date().toISOString() }));
    }, 15000);

    request.raw.on('close', () => {
      clearInterval(heartbeat);
      disconnect();
      reply.raw.end();
    });
  });
}

function formatSse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export function parseTypes(input: { contentTypes?: string | string[]; types?: string | string[] }): string[] {
  const values = normalizeQueryValues(input.contentTypes) ?? normalizeQueryValues(input.types);

  return values ?? [];
}

function normalizeQueryValues(value: string | string[] | undefined): string[] | null {
  if (typeof value === 'string') {
    const values = value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    return values.length ? values : null;
  }

  if (Array.isArray(value)) {
    const values = value.map((item) => item.trim()).filter(Boolean);
    return values.length ? values : null;
  }

  return null;
}
