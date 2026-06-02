import type { FastifyRequest } from "fastify";
import { resolveApiToken, type ApiagexDatabase } from "@apiagex/database";
import { resolveUserSessionToken } from "./user-auth.js";

export type ApiRoleCredential = {
  kind: "api-token" | "content-user";
  roleId: string;
};

export async function resolveApiRoleCredential(
  database: ApiagexDatabase,
  token: string,
): Promise<ApiRoleCredential | undefined> {
  const apiToken = await resolveApiToken(database, token);
  if (apiToken) return { kind: "api-token", roleId: apiToken.roleId };
  const userSession = await resolveUserSessionToken(database, token);
  if (userSession) return { kind: "content-user", roleId: userSession.user.roleId };
  return undefined;
}

export function apiRoleTokenFromRequest(request: FastifyRequest): string | undefined {
  const directToken = headerString(request.headers["x-apiagex-api-token"]);
  if (directToken) return directToken;
  const authorization = headerString(request.headers.authorization);
  if (!authorization?.toLowerCase().startsWith("bearer ")) return undefined;
  return authorization.slice(7).trim() || "__empty_api_token__";
}

function headerString(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value.trim() : undefined;
}
