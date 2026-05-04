import { createServer } from 'node:http';

const port = Number.parseInt(process.env.MANUAL_WEBHOOK_PORT ?? '8787', 10);

const server = createServer(async (request, response) => {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const body = Buffer.concat(chunks).toString('utf8');
  console.log(`[manual-webhook] ${request.method} ${request.url}`);
  console.log(`[manual-webhook] headers: ${JSON.stringify(request.headers)}`);
  console.log(`[manual-webhook] body: ${body}`);

  response.statusCode = 200;
  response.setHeader('content-type', 'text/plain; charset=utf-8');
  response.end('ok');
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Manual webhook listener running at http://127.0.0.1:${port}/hook`);
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});
