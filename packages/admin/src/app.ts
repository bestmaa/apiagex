import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { AdminApp, AdminConfig } from './app.type.js';

const PUBLIC_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../src/public');
const MIME_TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
};

export async function buildAdminApp(config: AdminConfig): Promise<AdminApp> {
  const server = createServer((request, response) => {
    void handleRequest(config, request, response);
  });

  await listen(server, config.host, config.port);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : config.port;

  return {
    address: `http://${config.host}:${port}`,
    close: () => closeServer(server),
    server,
  };
}

async function handleRequest(
  config: AdminConfig,
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? config.host}`);

  if (url.pathname === '/health') {
    sendJson(response, 200, {
      backendUrl: config.backendUrl,
      status: 'ok',
      ui: 'admin',
    });
    return;
  }

  if (url.pathname === '/docs') {
    sendRedirect(response, '/docs/');
    return;
  }

  if (url.pathname.startsWith('/docs/')) {
    await proxyRequest(config, request, response, url, url.pathname);
    return;
  }

  if (url.pathname === '/auth/login') {
    await proxyRequest(config, request, response, url, '/auth/login');
    return;
  }

  if (url.pathname === '/api/audit-logs') {
    await proxyRequest(config, request, response, url, '/admin/audit-logs');
    return;
  }

  if (url.pathname === '/api/webhooks' || url.pathname.startsWith('/api/webhooks/')) {
    await proxyRequest(config, request, response, url, url.pathname.replace('/api/webhooks', '/admin/webhooks'));
    return;
  }

  if (url.pathname === '/api/search') {
    await proxyRequest(config, request, response, url, '/admin/search');
    return;
  }

  if (url.pathname === '/api/roles' || url.pathname.startsWith('/api/roles/')) {
    await proxyRequest(config, request, response, url, url.pathname.replace('/api/roles', '/admin/roles'));
    return;
  }

  if (url.pathname === '/api/health/detail') {
    await proxyRequest(config, request, response, url, '/health/detail');
    return;
  }

  if (url.pathname === '/realtime/stream') {
    await proxyStreamRequest(config, request, response, url, '/realtime/stream');
    return;
  }

  if (url.pathname === '/api/backups/export') {
    await proxyRequest(config, request, response, url, '/admin/backups/export');
    return;
  }

  if (url.pathname === '/api/backups/restore') {
    await proxyRequest(config, request, response, url, '/admin/backups/restore');
    return;
  }

  if (url.pathname === '/api/migrations') {
    await proxyRequest(config, request, response, url, '/admin/migrations');
    return;
  }

  if (url.pathname === '/api/content-types' || url.pathname.startsWith('/api/content-types/')) {
    await proxyRequest(config, request, response, url, url.pathname.replace('/api/content-types', '/admin/content-types'));
    return;
  }

  if (url.pathname === '/api/media-files' || url.pathname.startsWith('/api/media-files/')) {
    await proxyRequest(config, request, response, url, url.pathname.replace('/api/media-files', '/admin/media-files'));
    return;
  }

  await serveStatic(response, url.pathname);
}

async function proxyRequest(
  config: AdminConfig,
  request: IncomingMessage,
  response: ServerResponse,
  url: URL,
  backendPath: string,
): Promise<void> {
  const backendUrl = new URL(backendPath + url.search, config.backendUrl);
  const headers = new Headers();

  for (const [key, value] of Object.entries(request.headers)) {
    if (typeof value === 'string' && !['connection', 'content-length', 'host'].includes(key)) {
      headers.set(key, value);
    }
  }

  const body = request.method && !['GET', 'HEAD'].includes(request.method) ? await readRequestBody(request) : undefined;
  const init: RequestInit = {
    headers,
    method: request.method ?? 'GET',
  };

  if (body !== undefined) {
    init.body = body;
  }

  const backendResponse = await fetch(backendUrl, init);
  const payload = await backendResponse.arrayBuffer();

  response.statusCode = backendResponse.status;
  backendResponse.headers.forEach((value, key) => {
    if (key !== 'content-length') {
      response.setHeader(key, value);
    }
  });
  response.end(Buffer.from(payload));
}

async function proxyStreamRequest(
  config: AdminConfig,
  request: IncomingMessage,
  response: ServerResponse,
  url: URL,
  backendPath: string,
): Promise<void> {
  const backendUrl = new URL(backendPath + url.search, config.backendUrl);
  const headers = new Headers();

  for (const [key, value] of Object.entries(request.headers)) {
    if (typeof value === 'string' && !['connection', 'content-length', 'host'].includes(key)) {
      headers.set(key, value);
    }
  }

  const backendResponse = await fetch(backendUrl, {
    headers,
    method: request.method ?? 'GET',
  });

  response.statusCode = backendResponse.status;
  backendResponse.headers.forEach((value, key) => {
    if (key !== 'content-length') {
      response.setHeader(key, value);
    }
  });

  if (!backendResponse.body) {
    response.end();
    return;
  }

  const reader = backendResponse.body.getReader();
  request.on('close', () => {
    void reader.cancel();
    response.end();
  });

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    response.write(Buffer.from(value));
  }

  response.end();
}

async function serveStatic(response: ServerResponse, pathname: string): Promise<void> {
  const filePath = resolve(PUBLIC_ROOT, pathname === '/' ? 'index.html' : pathname.slice(1));

  if (!isAllowedAsset(filePath)) {
    sendText(response, 404, 'Not found');
    return;
  }

  try {
    const asset = await readFile(filePath, 'utf8');
    response.statusCode = 200;
    response.setHeader('content-type', getContentType(filePath));
    response.end(asset);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      sendText(response, 404, 'Not found');
      return;
    }

    throw error;
  }
}

function isAllowedAsset(filePath: string): boolean {
  return filePath.startsWith(PUBLIC_ROOT);
}

function getContentType(filePath: string): string {
  const ext = filePath.slice(filePath.lastIndexOf('.'));
  return MIME_TYPES[ext] ?? 'text/plain; charset=utf-8';
}

async function readRequestBody(request: IncomingMessage): Promise<string | undefined> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return chunks.length > 0 ? Buffer.concat(chunks).toString('utf8') : undefined;
}

function sendJson(response: ServerResponse, statusCode: number, value: unknown): void {
  response.statusCode = statusCode;
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(value));
}

function sendText(response: ServerResponse, statusCode: number, value: string): void {
  response.statusCode = statusCode;
  response.setHeader('content-type', 'text/plain; charset=utf-8');
  response.end(value);
}

function sendRedirect(response: ServerResponse, location: string): void {
  response.statusCode = 302;
  response.setHeader('location', location);
  response.end();
}

async function listen(server: ReturnType<typeof createServer>, host: string, port: number): Promise<void> {
  await new Promise<void>((resolvePromise, rejectPromise) => {
    server.once('error', rejectPromise);
    server.listen(port, host, () => resolvePromise());
  });
}

function closeServer(server: ReturnType<typeof createServer>): Promise<void> {
  return new Promise((resolvePromise, rejectPromise) => {
    server.close((error) => {
      if (error) {
        rejectPromise(error);
        return;
      }

      resolvePromise();
    });
  });
}
