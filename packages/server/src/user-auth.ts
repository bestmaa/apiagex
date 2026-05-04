import { createHash } from "node:crypto";
import {
  getUserById,
  getUserPasswordHashByEmail,
  type SqliteDatabase,
} from "@apiagex/database";
import type { UserLoginInput, UserLoginResult } from "./user-auth.type.js";

export function loginUser(
  db: SqliteDatabase,
  input: UserLoginInput,
): UserLoginResult {
  const row = getUserPasswordHashByEmail(db, input.email);
  if (!row || row.passwordHash !== hashPassword(input.password)) {
    throw new Error("USER_LOGIN_INVALID");
  }
  const user = getUserById(db, row.id);
  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }
  return {
    ok: true,
    token: `user:${user.id}:${user.roleId}`,
    user: { id: user.id, email: user.email, roleId: user.roleId },
  };
}

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}
