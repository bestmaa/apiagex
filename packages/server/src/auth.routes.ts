import type { FastifyInstance } from 'fastify';

import type { AuthRoutesOptions, LoginInput } from './auth.routes.type.js';

export async function registerAuthRoutes(
  app: FastifyInstance,
  options: AuthRoutesOptions,
): Promise<void> {
  app.post('/auth/login', async (request, reply) => {
    const input = request.body as Partial<LoginInput>;
    const session = options.auth.login(input.email ?? '', input.password ?? '');

    if (!session) {
      return reply.code(401).send({ message: 'Invalid credentials' });
    }

    return {
      status: 'ok',
      token: session.token,
      user: session.user,
    };
  });
}
