import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  createAutomationToken,
  listAutomationTokens,
  revokeAutomationToken,
  type ApiagexDatabase,
} from "@apiagex/database";
import { ownerTokenFromRequest, verifyOwnerToken } from "./admin-auth.js";
import type { AutomationTokenBody, AutomationTokenParams } from "./automation-token-routes.type.js";

export function registerAutomationTokenRoutes(server: FastifyInstance, database: ApiagexDatabase): void {
  server.get("/api/admin/automation-tokens", async () => ({
    ok: true,
    tokens: await listAutomationTokens(database),
  }));

  server.post<{ Body: AutomationTokenBody }>("/api/admin/automation-tokens", async (request, reply) => {
    try {
      const actor = await adminActor(database, request);
      const created = await createAutomationToken(database, {
        name: request.body.name,
        scopes: request.body.scopes,
        ttlMinutes: request.body.ttlMinutes,
        createdById: actor?.id,
        createdByEmail: actor?.email,
      });
      return { ok: true, ...created };
    } catch (error) {
      return sendAutomationTokenError(reply, error, 400);
    }
  });

  server.delete<{ Params: AutomationTokenParams }>(
    "/api/admin/automation-tokens/:tokenId",
    async (request, reply) => {
      const token = await revokeAutomationToken(database, request.params.tokenId);
      if (!token) return reply.code(404).send({ ok: false, error: "AUTOMATION_TOKEN_NOT_FOUND" });
      return { ok: true, token };
    },
  );
}

async function adminActor(
  database: ApiagexDatabase,
  request: FastifyRequest,
): Promise<{ id: string; email: string } | undefined> {
  const result = await verifyOwnerToken(database, ownerTokenFromRequest(request));
  if (!result.ok) return undefined;
  return { id: result.user.id, email: result.user.email };
}

function sendAutomationTokenError(reply: FastifyReply, error: unknown, statusCode: number): FastifyReply {
  const message = error instanceof Error ? error.message : "AUTOMATION_TOKEN_REQUEST_FAILED";
  return reply.code(statusCode).send({ ok: false, error: message });
}
