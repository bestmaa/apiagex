import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  deleteInactiveCustomApiRoute,
  getRoleById,
  listCustomApiPermissionEvents,
  listCustomApiPermissions,
  listCustomApiRoutes,
  recordCustomApiPermissionEvent,
  setCustomApiPermission,
  updateCustomApiRouteMetadata,
  type ApiagexDatabase,
} from "@apiagex/database";
import { ownerTokenFromRequest, verifyOwnerToken } from "./admin-auth.js";
import type {
  CustomApiPermissionParams,
  CustomApiPermissionsBody,
  CustomApiRouteMetadataBody,
  CustomApiRouteParams,
} from "./custom-api-admin-routes.type.js";

export function registerCustomApiAdminRoutes(server: FastifyInstance, database: ApiagexDatabase): void {
  server.get("/api/admin/custom-api-routes", async () => ({
    ok: true,
    routes: await listCustomApiRoutes(database),
  }));

  server.put<{ Body: CustomApiRouteMetadataBody; Params: CustomApiRouteParams }>(
    "/api/admin/custom-api-routes/:routeId",
    async (request, reply) => {
      try {
        return {
          ok: true,
          route: await updateCustomApiRouteMetadata(database, {
            id: request.params.routeId,
            groupName: request.body.groupName,
            name: request.body.name,
          }),
        };
      } catch (error) {
        return sendCustomApiError(reply, error, 400);
      }
    },
  );

  server.delete<{ Params: CustomApiRouteParams }>("/api/admin/custom-api-routes/:routeId", async (request, reply) => {
    try {
      await deleteInactiveCustomApiRoute(database, request.params.routeId);
      return { ok: true, deleted: true };
    } catch (error) {
      return sendCustomApiError(reply, error, 400);
    }
  });

  server.get<{ Params: CustomApiRouteParams }>(
    "/api/admin/custom-api-routes/:routeId/history",
    async (request) => ({
      ok: true,
      events: await listCustomApiPermissionEvents(database, request.params.routeId),
    }),
  );

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
        const existing = new Map(
          (await listCustomApiPermissions(database, request.params.roleId))
            .map((permission) => [permission.customApiRouteId, permission.allowed]),
        );
        const actor = await customApiPermissionActor(database, request);
        for (const permission of request.body.permissions) {
          await setCustomApiPermission(database, { ...permission, roleId: request.params.roleId });
          if (existing.get(permission.customApiRouteId) !== permission.allowed) {
            await recordCustomApiPermissionEvent(database, {
              ...permission,
              actorEmail: actor.email,
              actorId: actor.id,
              roleId: request.params.roleId,
            });
          }
        }
        return { ok: true, permissions: await listCustomApiPermissions(database, request.params.roleId) };
      } catch (error) {
        return sendCustomApiError(reply, error, 400);
      }
    },
  );
}

async function customApiPermissionActor(
  database: ApiagexDatabase,
  request: FastifyRequest,
): Promise<{ email: string; id: string }> {
  const result = await verifyOwnerToken(database, ownerTokenFromRequest(request));
  if (result.ok) return { email: result.user.email, id: result.user.id };
  return { email: "admin", id: "admin" };
}

function sendCustomApiError(reply: FastifyReply, error: unknown, statusCode: number): FastifyReply {
  const message = error instanceof Error ? error.message : "CUSTOM_API_PERMISSION_FAILED";
  return reply.code(statusCode).send({ ok: false, error: message });
}
