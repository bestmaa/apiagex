import { describe, expect, it } from 'vitest';

import { buildServer } from '../src/app.js';
import { DEFAULT_ADMIN_PASSWORD } from '../src/config.js';

describe('auth routes', () => {
  it('issues a bearer token for valid credentials', async () => {
    const app = await buildServer({ logger: false });
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'admin@example.com',
        password: DEFAULT_ADMIN_PASSWORD,
      },
    });

    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: 'ok',
      user: {
        email: 'admin@example.com',
        role: 'admin',
      },
    });
    expect((response.json() as { token?: string }).token).toBeTruthy();
  });

  it('rejects invalid credentials', async () => {
    const app = await buildServer({ logger: false });
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'admin@example.com',
        password: 'wrong-password',
      },
    });

    await app.close();

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      message: 'Invalid credentials',
    });
  });

  it('issues tokens for configured editor and viewer accounts', async () => {
    const app = await buildServer({
      editorEmail: 'editor@example.com',
      editorPassword: 'editor123',
      logger: false,
      viewerEmail: 'viewer@example.com',
      viewerPassword: 'viewer123',
    });

    const editor = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'editor@example.com',
        password: 'editor123',
      },
    });
    const viewer = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'viewer@example.com',
        password: 'viewer123',
      },
    });

    await app.close();

    expect(editor.statusCode).toBe(200);
    expect(editor.json()).toMatchObject({
      user: {
        email: 'editor@example.com',
        role: 'editor',
      },
    });
    expect(viewer.statusCode).toBe(200);
    expect(viewer.json()).toMatchObject({
      user: {
        email: 'viewer@example.com',
        role: 'viewer',
      },
    });
  });
});
