import type { FastifyInstance, FastifyReply } from "fastify";
import {
  createRole,
  getRoleById,
  listRolePermissions,
  listRoles,
  setPermission,
  type SqliteDatabase,
} from "@apiagex/database";
import type { RoleBody, RoleParams, RolePermissionsBody } from "./role-routes.type.js";

export function registerRoleRoutes(server: FastifyInstance, database: SqliteDatabase): void {
  server.get("/api/admin/roles", async () => ({
    ok: true,
    roles: listRoles(database),
  }));

  server.post<{ Body: RoleBody }>("/api/admin/roles", async (request, reply) => {
    try {
      return { ok: true, role: createRole(database, request.body) };
    } catch (error) {
      return sendRoleError(reply, error, 400);
    }
  });

  server.get<{ Params: RoleParams }>("/api/admin/roles/:roleId", async (request, reply) => {
    const role = getRoleById(database, request.params.roleId);
    if (!role) {
      return reply.code(404).send({ ok: false, error: "ROLE_NOT_FOUND" });
    }
    return { ok: true, role };
  });

  server.get<{ Params: RoleParams }>(
    "/api/admin/roles/:roleId/permissions",
    async (request, reply) => {
      if (!getRoleById(database, request.params.roleId)) {
        return reply.code(404).send({ ok: false, error: "ROLE_NOT_FOUND" });
      }
      return { ok: true, permissions: listRolePermissions(database, request.params.roleId) };
    },
  );

  server.put<{ Body: RolePermissionsBody; Params: RoleParams }>(
    "/api/admin/roles/:roleId/permissions",
    async (request, reply) => {
      try {
        for (const permission of request.body.permissions) {
          setPermission(database, { ...permission, roleId: request.params.roleId });
        }
        return { ok: true, permissions: listRolePermissions(database, request.params.roleId) };
      } catch (error) {
        return sendRoleError(reply, error, 400);
      }
    },
  );
}

function sendRoleError(reply: FastifyReply, error: unknown, statusCode: number): FastifyReply {
  const message = error instanceof Error ? error.message : "ROLE_REQUEST_FAILED";
  return reply.code(statusCode).send({ ok: false, error: message });
}
