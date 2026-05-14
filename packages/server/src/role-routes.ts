import type { FastifyInstance, FastifyReply } from "fastify";
import {
  createApiToken,
  createRole,
  getRoleById,
  listApiTokens,
  listRolePermissions,
  listRoles,
  revokeApiToken,
  setPermission,
  type ApiagexDatabase,
} from "@apiagex/database";
import type {
  RoleBody,
  RoleParams,
  RolePermissionsBody,
  RoleTokenBody,
  RoleTokenParams,
} from "./role-routes.type.js";

export function registerRoleRoutes(server: FastifyInstance, database: ApiagexDatabase): void {
  server.get("/api/admin/roles", async () => ({
    ok: true,
    roles: await listRoles(database),
  }));

  server.post<{ Body: RoleBody }>("/api/admin/roles", async (request, reply) => {
    try {
      return { ok: true, role: await createRole(database, request.body) };
    } catch (error) {
      return sendRoleError(reply, error, 400);
    }
  });

  server.get<{ Params: RoleParams }>("/api/admin/roles/:roleId", async (request, reply) => {
    const role = await getRoleById(database, request.params.roleId);
    if (!role || role.roleKind !== "api") return reply.code(404).send({ ok: false, error: "ROLE_NOT_FOUND" });
    return { ok: true, role };
  });

  server.get<{ Params: RoleParams }>("/api/admin/roles/:roleId/permissions", async (request, reply) => {
    const role = await getRoleById(database, request.params.roleId);
    if (!role || role.roleKind !== "api") return reply.code(404).send({ ok: false, error: "ROLE_NOT_FOUND" });
    return { ok: true, permissions: await listRolePermissions(database, request.params.roleId) };
  });

  server.put<{ Body: RolePermissionsBody; Params: RoleParams }>(
    "/api/admin/roles/:roleId/permissions",
    async (request, reply) => {
      try {
        for (const permission of request.body.permissions) {
          await setPermission(database, { ...permission, roleId: request.params.roleId });
        }
        return { ok: true, permissions: await listRolePermissions(database, request.params.roleId) };
      } catch (error) {
        return sendRoleError(reply, error, 400);
      }
    },
  );

  server.get<{ Params: RoleParams }>("/api/admin/roles/:roleId/tokens", async (request, reply) => {
    const role = await getRoleById(database, request.params.roleId);
    if (!role || role.roleKind !== "api") return reply.code(404).send({ ok: false, error: "ROLE_NOT_FOUND" });
    return { ok: true, tokens: await listApiTokens(database, request.params.roleId) };
  });

  server.post<{ Body: RoleTokenBody; Params: RoleParams }>(
    "/api/admin/roles/:roleId/tokens",
    async (request, reply) => {
      try {
        const created = await createApiToken(database, {
          roleId: request.params.roleId,
          name: request.body.name,
        });
        return { ok: true, ...created };
      } catch (error) {
        return sendRoleError(reply, error, 400);
      }
    },
  );

  server.delete<{ Params: RoleTokenParams }>("/api/admin/roles/:roleId/tokens/:tokenId", async (request, reply) => {
    try {
      const token = await revokeApiToken(database, request.params.roleId, request.params.tokenId);
      if (!token) return reply.code(404).send({ ok: false, error: "API_TOKEN_NOT_FOUND" });
      return { ok: true, token };
    } catch (error) {
      return sendRoleError(reply, error, 400);
    }
  });
}

function sendRoleError(reply: FastifyReply, error: unknown, statusCode: number): FastifyReply {
  const message = error instanceof Error ? error.message : "ROLE_REQUEST_FAILED";
  return reply.code(statusCode).send({ ok: false, error: message });
}
