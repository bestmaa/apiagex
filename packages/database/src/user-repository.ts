import { randomUUID } from "node:crypto";
import type { ApiagexDatabase } from "./database-adapter.type.js";
import { getRoleById } from "./role-repository.js";
import type { CreateUserInput, UserRecord } from "./user-repository.type.js";

type UserPasswordRecord = { id: string; passwordHash: string; roleId: string };
type UserRow = UserRecord;

export async function createUser(db: ApiagexDatabase, input: CreateUserInput): Promise<UserRecord> {
  const email = normalizeEmail(input.email);
  await validateUser(db, { ...input, email });
  const id = randomUUID();
  const now = new Date().toISOString();
  await db.prepare(
    "INSERT INTO users (id, email, password_hash, role_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
  ).run(id, email, input.passwordHash, input.roleId, now, now);
  return requireUser(db, id);
}

export async function listUsers(db: ApiagexDatabase): Promise<UserRecord[]> {
  return db.prepare(userSelectSql("WHERE roles.role_kind = 'api' ORDER BY users.created_at ASC")).all<UserRow>();
}

export async function listAdminUsers(db: ApiagexDatabase): Promise<UserRecord[]> {
  return db.prepare(userSelectSql("WHERE roles.role_kind = 'admin' AND roles.is_owner = 0 ORDER BY users.created_at ASC")).all<UserRow>();
}

export async function getUserById(db: ApiagexDatabase, id: string): Promise<UserRecord | undefined> {
  return db.prepare(userSelectSql("WHERE users.id = ? AND roles.role_kind = 'api'")).get<UserRow>(id);
}

export async function getAdminUserById(db: ApiagexDatabase, id: string): Promise<UserRecord | undefined> {
  return db.prepare(userSelectSql("WHERE users.id = ? AND roles.role_kind = 'admin' AND roles.is_owner = 0")).get<UserRow>(id);
}

export async function getUserPasswordHashByEmail(
  db: ApiagexDatabase,
  email: string,
): Promise<UserPasswordRecord | undefined> {
  return db
    .prepare(
      `SELECT users.id, users.password_hash as passwordHash, users.role_id as roleId
       FROM users JOIN roles ON roles.id = users.role_id
       WHERE users.email = ? AND roles.role_kind = 'api'`,
    )
    .get<UserPasswordRecord>(normalizeEmail(email));
}

async function validateUser(db: ApiagexDatabase, input: CreateUserInput): Promise<void> {
  if (!input.email.includes("@")) throw new Error("USER_EMAIL_INVALID");
  if (!input.passwordHash) throw new Error("USER_PASSWORD_HASH_REQUIRED");
  const role = await getRoleById(db, input.roleId);
  if (!role) throw new Error("ROLE_NOT_FOUND");
  if (role.isOwner) throw new Error("ROLE_OWNER_LOCKED");
  const requiredKind = input.roleKind ?? "api";
  if (role.roleKind !== requiredKind) throw new Error(requiredKind === "admin" ? "ROLE_ADMIN_REQUIRED" : "ROLE_API_REQUIRED");
}

async function requireUser(db: ApiagexDatabase, id: string): Promise<UserRecord> {
  const user = await db.prepare(userSelectSql("WHERE users.id = ?")).get<UserRow>(id);
  if (!user) throw new Error("USER_NOT_FOUND");
  return user;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function userSelectSql(suffix: string): string {
  return `SELECT users.id, users.email, users.role_id as roleId, roles.name as roleName, roles.role_kind as roleKind, users.created_at as createdAt, users.updated_at as updatedAt FROM users JOIN roles ON roles.id = users.role_id ${suffix}`;
}
