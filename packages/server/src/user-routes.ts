import { createHash } from "node:crypto";
import type { FastifyInstance, FastifyReply } from "fastify";
import {
  createUser,
  getAdminUserById,
  getUserById,
  listAdminRoles,
  listAdminUsers,
  listRoles,
  listUsers,
  type ApiagexDatabase,
} from "@apiagex/database";
import type { UserBody, UserParams } from "./user-routes.type.js";

export function registerUserRoutes(server: FastifyInstance, database: ApiagexDatabase): void {
  server.get("/api/admin/users", async () => ({
    ok: true,
    roles: await listRoles(database),
    users: await listUsers(database),
  }));

  server.get("/api/admin/control-users", async () => ({
    ok: true,
    roles: (await listAdminRoles(database)).filter((role) => !role.isOwner),
    users: await listAdminUsers(database),
  }));

  server.post<{ Body: UserBody }>("/api/admin/users", async (request, reply) => {
    try {
      validatePassword(request.body.password);
      return {
        ok: true,
        user: await createUser(database, {
          email: request.body.email,
          passwordHash: hashPassword(request.body.password),
          roleId: request.body.roleId,
        }),
      };
    } catch (error) {
      return sendUserError(reply, error, 400);
    }
  });

  server.post<{ Body: UserBody }>("/api/admin/control-users", async (request, reply) => {
    try {
      validatePassword(request.body.password);
      return {
        ok: true,
        user: await createUser(database, {
          email: request.body.email,
          passwordHash: hashPassword(request.body.password),
          roleId: request.body.roleId,
          roleKind: "admin",
        }),
      };
    } catch (error) {
      return sendUserError(reply, error, 400);
    }
  });

  server.get<{ Params: UserParams }>("/api/admin/users/:userId", async (request, reply) => {
    const user = await getUserById(database, request.params.userId);
    if (!user) return reply.code(404).send({ ok: false, error: "USER_NOT_FOUND" });
    return { ok: true, user };
  });

  server.get<{ Params: UserParams }>("/api/admin/control-users/:userId", async (request, reply) => {
    const user = await getAdminUserById(database, request.params.userId);
    if (!user) return reply.code(404).send({ ok: false, error: "USER_NOT_FOUND" });
    return { ok: true, user };
  });
}

function validatePassword(password: string): void {
  if (password.length < 8) throw new Error("USER_PASSWORD_TOO_SHORT");
}

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

function sendUserError(reply: FastifyReply, error: unknown, statusCode: number): FastifyReply {
  const message = error instanceof Error ? error.message : "USER_REQUEST_FAILED";
  return reply.code(statusCode).send({ ok: false, error: message });
}
