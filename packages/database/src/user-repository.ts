import { randomUUID } from "node:crypto";
import type { SqliteDatabase } from "./sqlite.js";
import { getRoleById } from "./role-repository.js";
import type { CreateUserInput, UserRecord } from "./user-repository.type.js";

type UserRow = UserRecord;

export function createUser(db: SqliteDatabase, input: CreateUserInput): UserRecord {
  const email = normalizeEmail(input.email);
  validateUser(db, { ...input, email });
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    "INSERT INTO users (id, email, password_hash, role_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
  ).run(id, email, input.passwordHash, input.roleId, now, now);
  return requireUser(db, id);
}

export function listUsers(db: SqliteDatabase): UserRecord[] {
  const rows = db
    .prepare(userSelectSql("WHERE roles.role_kind = 'api' ORDER BY users.created_at ASC"))
    .all() as UserRow[];
  return rows;
}

export function getUserById(db: SqliteDatabase, id: string): UserRecord | undefined {
  return db
    .prepare(userSelectSql("WHERE users.id = ? AND roles.role_kind = 'api'"))
    .get(id) as UserRow | undefined;
}

export function getUserPasswordHashByEmail(
  db: SqliteDatabase,
  email: string,
): { id: string; passwordHash: string; roleId: string } | undefined {
  return db
    .prepare(
      `SELECT users.id, users.password_hash as passwordHash, users.role_id as roleId
       FROM users JOIN roles ON roles.id = users.role_id
       WHERE users.email = ? AND roles.role_kind = 'api'`,
    )
    .get(normalizeEmail(email)) as { id: string; passwordHash: string; roleId: string } | undefined;
}

function validateUser(db: SqliteDatabase, input: CreateUserInput): void {
  if (!input.email.includes("@")) {
    throw new Error("USER_EMAIL_INVALID");
  }
  if (!input.passwordHash) {
    throw new Error("USER_PASSWORD_HASH_REQUIRED");
  }
  const role = getRoleById(db, input.roleId);
  if (!role) {
    throw new Error("ROLE_NOT_FOUND");
  }
  if (role.roleKind !== "api") {
    throw new Error("ROLE_API_REQUIRED");
  }
}

function requireUser(db: SqliteDatabase, id: string): UserRecord {
  const user = getUserById(db, id);
  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }
  return user;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function userSelectSql(suffix: string): string {
  return `SELECT users.id, users.email, users.role_id as roleId, roles.name as roleName, roles.role_kind as roleKind, users.created_at as createdAt, users.updated_at as updatedAt FROM users JOIN roles ON roles.id = users.role_id ${suffix}`;
}
