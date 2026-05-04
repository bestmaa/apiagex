import fastifyStatic from '@fastify/static';
import { readFile } from 'node:fs/promises';
import type { FastifyInstance } from 'fastify';

export async function registerAdminUiRoutes(
  app: FastifyInstance,
  root: string,
  readmeFile: string,
): Promise<void> {
  await app.register(fastifyStatic, {
    decorateReply: false,
    index: 'index.html',
    prefix: '/adminui/',
    root,
  });

  app.get('/adminui', async (_request, reply) => reply.redirect('/adminui/'));
  app.get('/readme', async (_request, reply) => {
    const readme = await readFile(readmeFile, 'utf8');
    return reply.type('text/markdown; charset=utf-8').send(readme);
  });
}
