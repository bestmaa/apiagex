import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import {
  getRoleById,
  getUserById,
  getUserPasswordHashByEmail,
  type ApiagexDatabase,
} from "@apiagex/database";
import type { UserLoginInput, UserLoginResult, UserSessionResult } from "./user-auth.type.js";

const contentUserTokenPrefix = "agxu_";
const contentUserTokenTtlMs = 7 * 24 * 60 * 60 * 1000;

type UserSessionPayload = {
  exp: number;
  role: string;
  sub: string;
  typ: "apiagex-content-user";
};

type UserSessionRow = {
  id: string;
  email: string;
  passwordHash: string;
  roleId: string;
  roleName: string;
};

export async function loginUser(db: ApiagexDatabase, input: UserLoginInput): Promise<UserLoginResult> {
  const row = await getUserPasswordHashByEmail(db, input.email);
  if (!row || row.passwordHash !== hashPassword(input.password)) throw new Error("USER_LOGIN_INVALID");
  const user = await getUserById(db, row.id);
  if (!user) throw new Error("USER_NOT_FOUND");
  const role = await getRoleById(db, user.roleId);
  if (!role || role.roleKind !== "api") throw new Error("ROLE_API_REQUIRED");
  const expiresAtMs = Date.now() + contentUserTokenTtlMs;
  return {
    ok: true,
    expiresAt: new Date(expiresAtMs).toISOString(),
    token: issueUserSessionToken({
      expiresAtMs,
      passwordHash: row.passwordHash,
      roleId: user.roleId,
      userId: user.id,
    }),
    tokenType: "content-user",
    user: { id: user.id, email: user.email, roleId: user.roleId, roleName: user.roleName },
  };
}

export async function resolveUserSessionToken(
  db: ApiagexDatabase,
  token: string,
  nowMs = Date.now(),
): Promise<UserSessionResult | undefined> {
  const parsed = parseUserSessionToken(token);
  if (!parsed || parsed.payload.exp <= nowMs) return undefined;
  const row = await getUserSessionRow(db, parsed.payload.sub);
  if (!row || row.roleId !== parsed.payload.role) return undefined;
  const expected = userSessionSignature(parsed.encodedPayload, row.passwordHash);
  if (!safeEqual(parsed.signature, expected)) return undefined;
  return {
    ok: true,
    user: {
      email: row.email,
      id: row.id,
      roleId: row.roleId,
      roleName: row.roleName,
    },
  };
}

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

function issueUserSessionToken(input: {
  expiresAtMs: number;
  passwordHash: string;
  roleId: string;
  userId: string;
}): string {
  const payload: UserSessionPayload = {
    exp: input.expiresAtMs,
    role: input.roleId,
    sub: input.userId,
    typ: "apiagex-content-user",
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${contentUserTokenPrefix}${encodedPayload}.${userSessionSignature(encodedPayload, input.passwordHash)}`;
}

function parseUserSessionToken(token: string): {
  encodedPayload: string;
  payload: UserSessionPayload;
  signature: string;
} | undefined {
  if (!token.startsWith(contentUserTokenPrefix)) return undefined;
  const body = token.slice(contentUserTokenPrefix.length);
  const [encodedPayload, signature, extra] = body.split(".");
  if (!encodedPayload || !signature || extra !== undefined) return undefined;
  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as Partial<UserSessionPayload>;
    if (
      payload.typ !== "apiagex-content-user"
      || typeof payload.sub !== "string"
      || typeof payload.role !== "string"
      || typeof payload.exp !== "number"
      || !Number.isFinite(payload.exp)
    ) {
      return undefined;
    }
    return { encodedPayload, payload: payload as UserSessionPayload, signature };
  } catch {
    return undefined;
  }
}

function userSessionSignature(encodedPayload: string, passwordHash: string): string {
  return createHmac("sha256", passwordHash).update(encodedPayload).digest("base64url");
}

async function getUserSessionRow(db: ApiagexDatabase, userId: string): Promise<UserSessionRow | undefined> {
  return db
    .prepare(
      `SELECT users.id,
        users.email,
        users.password_hash as passwordHash,
        users.role_id as roleId,
        roles.name as roleName
       FROM users
       JOIN roles ON roles.id = users.role_id
       WHERE users.id = ? AND roles.role_kind = 'api'`,
    )
    .get<UserSessionRow>(userId);
}

function safeEqual(value: string, expected: string): boolean {
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);
  return valueBuffer.length === expectedBuffer.length && timingSafeEqual(valueBuffer, expectedBuffer);
}
