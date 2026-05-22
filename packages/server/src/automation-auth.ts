import type { FastifyReply, FastifyRequest } from "fastify";
import {
  resolveAutomationToken,
  type ApiagexDatabase,
  type AutomationTokenRecord,
  type AutomationTokenScope,
} from "@apiagex/database";

export type AutomationAuthResult =
  | { ok: true; tokenRecord: AutomationTokenRecord }
  | { ok: false; error: "AUTOMATION_TOKEN_REQUIRED" | "AUTOMATION_TOKEN_INVALID" };

export async function verifyAutomationToken(
  db: ApiagexDatabase,
  token: string | undefined,
  requiredScopes: AutomationTokenScope[] = [],
): Promise<AutomationAuthResult> {
  if (!token) return { ok: false, error: "AUTOMATION_TOKEN_REQUIRED" };
  const result = await resolveAutomationToken(db, token, requiredScopes);
  if (!result) return { ok: false, error: "AUTOMATION_TOKEN_INVALID" };
  return { ok: true, tokenRecord: result.tokenRecord };
}

export function automationTokenFromRequest(request: FastifyRequest): string | undefined {
  const header = request.headers["x-apiagex-automation-token"];
  if (Array.isArray(header)) return header[0];
  return header;
}

export async function requireAutomationToken(
  db: ApiagexDatabase,
  request: FastifyRequest,
  reply: FastifyReply,
  requiredScopes: AutomationTokenScope[] = [],
): Promise<AutomationTokenRecord | undefined> {
  const result = await verifyAutomationToken(db, automationTokenFromRequest(request), requiredScopes);
  if (result.ok) return result.tokenRecord;
  await reply.code(401).send({ ok: false, error: result.error });
  return undefined;
}
