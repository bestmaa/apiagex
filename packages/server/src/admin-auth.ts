import { createHash, timingSafeEqual } from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ApiagexDatabase } from "@apiagex/database";

export type AdminAuthUser = {
  email: string;
  id: string;
  role: "owner";
};

export type AdminAuthResult =
  | { ok: true; user: AdminAuthUser }
  | { ok: false; error: "ADMIN_AUTH_REQUIRED" | "ADMIN_AUTH_INVALID" };

export function issueOwnerToken(userId: string, passwordHash: string): string {
  return `owner:${userId}:${ownerTokenSignature(userId, passwordHash)}`;
}

export async function verifyOwnerToken(db: ApiagexDatabase, token: string | undefined): Promise<AdminAuthResult> {
  if (!token) return { ok: false, error: "ADMIN_AUTH_REQUIRED" };
  const parts = token.split(":");
  if (parts.length !== 3 || parts[0] !== "owner" || !parts[1] || !parts[2]) {
    return { ok: false, error: "ADMIN_AUTH_INVALID" };
  }
  const row = await db
    .prepare(
      "SELECT users.id, users.email, users.password_hash FROM users JOIN roles ON roles.id = users.role_id WHERE users.id = ? AND roles.is_owner = 1",
    )
    .get<{ id: string; email: string; password_hash: string }>(parts[1]);
  if (!row) return { ok: false, error: "ADMIN_AUTH_INVALID" };
  const expected = ownerTokenSignature(row.id, row.password_hash);
  if (!safeEqual(parts[2], expected)) return { ok: false, error: "ADMIN_AUTH_INVALID" };
  return { ok: true, user: { email: row.email, id: row.id, role: "owner" } };
}

export function registerAdminAuthGuard(server: FastifyInstance, db: ApiagexDatabase): void {
  server.addHook("preHandler", async (request, reply) => {
    if (!isAdminApiPath(request.url)) return;
    const result = await verifyOwnerToken(db, ownerTokenFromRequest(request));
    if (result.ok) return;
    return reply.code(401).send({ ok: false, error: result.error });
  });
}

export function ownerTokenFromRequest(request: FastifyRequest): string | undefined {
  const authorization = request.headers.authorization;
  if (authorization?.toLowerCase().startsWith("bearer ")) return authorization.slice(7).trim();
  const header = request.headers["x-apiagex-admin-token"];
  if (Array.isArray(header)) return header[0];
  return header;
}

export async function sendAdminSession(db: ApiagexDatabase, request: FastifyRequest, reply: FastifyReply) {
  const result = await verifyOwnerToken(db, ownerTokenFromRequest(request));
  if (!result.ok) return reply.code(401).send({ ok: false, error: result.error });
  return { ok: true, user: result.user };
}

function isAdminApiPath(path: string): boolean {
  return path === "/api/admin" || path.startsWith("/api/admin/");
}

function ownerTokenSignature(userId: string, passwordHash: string): string {
  return createHash("sha256").update(`${userId}:${passwordHash}`).digest("hex");
}

function safeEqual(value: string, expected: string): boolean {
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);
  return valueBuffer.length === expectedBuffer.length && timingSafeEqual(valueBuffer, expectedBuffer);
}
