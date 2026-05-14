import { createHash } from "node:crypto";
import {
  getRoleById,
  getUserById,
  getUserPasswordHashByEmail,
  type ApiagexDatabase,
} from "@apiagex/database";
import type { UserLoginInput, UserLoginResult } from "./user-auth.type.js";

export async function loginUser(db: ApiagexDatabase, input: UserLoginInput): Promise<UserLoginResult> {
  const row = await getUserPasswordHashByEmail(db, input.email);
  if (!row || row.passwordHash !== hashPassword(input.password)) throw new Error("USER_LOGIN_INVALID");
  const user = await getUserById(db, row.id);
  if (!user) throw new Error("USER_NOT_FOUND");
  const role = await getRoleById(db, user.roleId);
  if (!role || role.roleKind !== "api") throw new Error("ROLE_API_REQUIRED");
  return {
    ok: true,
    token: `user:${user.id}:${user.roleId}`,
    user: { id: user.id, email: user.email, roleId: user.roleId },
  };
}

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}
