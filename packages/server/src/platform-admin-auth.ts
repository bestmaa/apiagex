import { timingSafeEqual } from "node:crypto";
import type { FastifyInstance, FastifyRequest } from "fastify";

export type PlatformAdminAuthResult =
  | { ok: true }
  | { error: "PLATFORM_ADMIN_AUTH_REQUIRED" | "PLATFORM_ADMIN_AUTH_INVALID"; ok: false };

export function registerPlatformAdminAuthGuard(
  server: FastifyInstance,
  expectedToken: string | undefined,
): void {
  server.addHook("preHandler", async (request, reply) => {
    if (!isPlatformApiPath(request.url)) return;
    const result = verifyPlatformAdminToken(expectedToken, platformAdminTokenFromRequest(request));
    if (result.ok) return;
    return reply.code(401).send({ ok: false, error: result.error });
  });
}

export function verifyPlatformAdminToken(
  expectedToken: string | undefined,
  token: string | undefined,
): PlatformAdminAuthResult {
  if (!expectedToken) return { error: "PLATFORM_ADMIN_AUTH_REQUIRED", ok: false };
  if (!token) return { error: "PLATFORM_ADMIN_AUTH_REQUIRED", ok: false };
  if (!safeEqual(token, expectedToken)) return { error: "PLATFORM_ADMIN_AUTH_INVALID", ok: false };
  return { ok: true };
}

export function platformAdminTokenFromRequest(request: FastifyRequest): string | undefined {
  const authorization = request.headers.authorization;
  if (authorization?.toLowerCase().startsWith("bearer ")) return authorization.slice(7).trim();
  const header = request.headers["x-apiagex-platform-token"];
  if (Array.isArray(header)) return header[0];
  return header;
}

export function isPlatformApiPath(path: string): boolean {
  return path === "/api/platform" || path.startsWith("/api/platform/");
}

function safeEqual(value: string, expected: string): boolean {
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);
  return valueBuffer.length === expectedBuffer.length && timingSafeEqual(valueBuffer, expectedBuffer);
}
