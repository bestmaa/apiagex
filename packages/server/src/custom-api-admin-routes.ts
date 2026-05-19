import type { FastifyInstance, FastifyReply } from "fastify";
import {
  getRoleById,
  listCustomApiPermissions,
  listCustomApiRoutes,
  setCustomApiPermission,
  type ApiagexDatabase,
} from "@apiagex/database";
import type { CustomApiPermissionParams, CustomApiPermissionsBody } from "./custom-api-admin-routes.type.js";

export function registerCustomApiAdminRoutes(server: FastifyInstance, database: ApiagexDatabase): void {
  server.get("/api/admin/custom-api-routes", async () => ({
    ok: true,
    routes: await listCustomApiRoutes(database),
  }));

  server.get<{ Params: CustomApiPermissionParams }>(
    "/api/admin/roles/:roleId/custom-api-permissions",
    async (request, reply) => {
      const role = await getRoleById(database, request.params.roleId);
      if (!role || role.roleKind !== "api") return reply.code(404).send({ ok: false, error: "ROLE_NOT_FOUND" });
      return { ok: true, permissions: await listCustomApiPermissions(database, request.params.roleId) };
    },
  );

  server.put<{ Body: CustomApiPermissionsBody; Params: CustomApiPermissionParams }>(
    "/api/admin/roles/:roleId/custom-api-permissions",
    async (request, reply) => {
      try {
        for (const permission of request.body.permissions) {
          await setCustomApiPermission(database, { ...permission, roleId: request.params.roleId });
        }
        return { ok: true, permissions: await listCustomApiPermissions(database, request.params.roleId) };
      } catch (error) {
        return sendCustomApiError(reply, error, 400);
      }
    },
  );
}

function sendCustomApiError(reply: FastifyReply, error: unknown, statusCode: number): FastifyReply {
  const message = error instanceof Error ? error.message : "CUSTOM_API_PERMISSION_FAILED";
  return reply.code(statusCode).send({ ok: false, error: message });
}
