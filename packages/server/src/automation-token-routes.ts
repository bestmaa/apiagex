import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { readFile, writeFile } from "node:fs/promises";
import {
  createAutomationToken,
  listAutomationTokens,
  revokeAutomationToken,
  type ApiagexDatabase,
} from "@apiagex/database";
import { ownerTokenFromRequest, verifyOwnerToken } from "./admin-auth.js";
import type { AutomationTokenBody, AutomationTokenParams } from "./automation-token-routes.type.js";

type AutomationTokenRouteOptions = {
  projectEnvPath?: string;
};

export function registerAutomationTokenRoutes(
  server: FastifyInstance,
  database: ApiagexDatabase,
  options: AutomationTokenRouteOptions = {},
): void {
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
      if (request.body.persistToProject) {
        if (!options.projectEnvPath) {
          return {
            ok: true,
            ...created,
            projectEnv: { ok: false, error: "PROJECT_ENV_PATH_UNAVAILABLE" },
          };
        }
        await saveAutomationTokenToEnv(options.projectEnvPath, created.token);
        return {
          ok: true,
          ...created,
          projectEnv: { ok: true, path: options.projectEnvPath },
        };
      }
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

async function saveAutomationTokenToEnv(envPath: string, token: string): Promise<void> {
  const previous = await readEnvFile(envPath);
  await writeFile(envPath, upsertDotEnvValue(previous, "APIAGEX_AUTOMATION_TOKEN", token), "utf8");
}

async function readEnvFile(envPath: string): Promise<string> {
  try {
    return await readFile(envPath, "utf8");
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "ENOENT") return "";
    throw error;
  }
}

function upsertDotEnvValue(content: string, key: string, value: string): string {
  const line = `${key}=${value}`;
  const lines = content.split(/\r?\n/);
  const existingIndex = lines.findIndex((item) => item.trimStart().startsWith(`${key}=`));
  if (existingIndex >= 0) {
    lines[existingIndex] = line;
    return ensureTrailingNewline(lines.join("\n"));
  }
  const base = content.trimEnd();
  return `${base}${base ? "\n" : ""}${line}\n`;
}

function ensureTrailingNewline(content: string): string {
  return content.endsWith("\n") ? content : `${content}\n`;
}
