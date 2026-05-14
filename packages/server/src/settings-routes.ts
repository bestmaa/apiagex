import type { FastifyInstance, FastifyReply } from "fastify";
import {
  createAdminRole,
  getRoleById,
  listAdminRolePermissions,
  listAdminRoles,
  listRoles,
  setAdminPermission,
  type ApiagexDatabase,
} from "@apiagex/database";
import type {
  AdminRoleBody,
  AdminRoleParams,
  AdminRolePermissionsBody,
} from "./settings-routes.type.js";

export function registerSettingsRoutes(server: FastifyInstance, database: ApiagexDatabase): void {
  server.get("/api/admin/settings/access", async () => ({
    ok: true,
    adminRoles: await listAdminRoles(database),
    apiRoles: await listRoles(database),
  }));

  server.post<{ Body: AdminRoleBody }>("/api/admin/settings/access/admin-roles", async (request, reply) => {
    try {
      return { ok: true, role: await createAdminRole(database, request.body) };
    } catch (error) {
      return sendSettingsError(reply, error, 400);
    }
  });

  server.get<{ Params: AdminRoleParams }>(
    "/api/admin/settings/access/admin-roles/:roleId/permissions",
    async (request, reply) => {
      const role = await getRoleById(database, request.params.roleId);
      if (!role || role.roleKind !== "admin") return reply.code(404).send({ ok: false, error: "ROLE_NOT_FOUND" });
      return { ok: true, permissions: await listAdminRolePermissions(database, request.params.roleId) };
    },
  );

  server.put<{ Body: AdminRolePermissionsBody; Params: AdminRoleParams }>(
    "/api/admin/settings/access/admin-roles/:roleId/permissions",
    async (request, reply) => {
      try {
        for (const permission of request.body.permissions) {
          await setAdminPermission(database, { ...permission, roleId: request.params.roleId });
        }
        return { ok: true, permissions: await listAdminRolePermissions(database, request.params.roleId) };
      } catch (error) {
        return sendSettingsError(reply, error, 400);
      }
    },
  );
}

function sendSettingsError(reply: FastifyReply, error: unknown, statusCode: number): FastifyReply {
  const message = error instanceof Error ? error.message : "SETTINGS_REQUEST_FAILED";
  return reply.code(statusCode).send({ ok: false, error: message });
}
