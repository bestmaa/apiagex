import type { FastifyInstance, FastifyReply } from "fastify";
import {
  createRole,
  getRoleById,
  listRoles,
  type SqliteDatabase,
} from "@apiagex/database";
import type { RoleBody, RoleParams } from "./role-routes.type.js";

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
}

function sendRoleError(reply: FastifyReply, error: unknown, statusCode: number): FastifyReply {
  const message = error instanceof Error ? error.message : "ROLE_REQUEST_FAILED";
  return reply.code(statusCode).send({ ok: false, error: message });
}
