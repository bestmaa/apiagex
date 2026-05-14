import { randomUUID } from "node:crypto";
import type { ApiagexDatabase } from "./database-adapter.type.js";
import type { CreateRoleInput, RoleRecord } from "./role-repository.type.js";

type RoleRow = Omit<RoleRecord, "isOwner"> & { isOwner: number };

const roleNamePattern = /^[a-z][a-z0-9-]*$/;
const adminRoleNames = new Set(["owner", "admin", "schema-manager", "user-manager"]);

export async function createRole(db: ApiagexDatabase, input: CreateRoleInput): Promise<RoleRecord> {
  validateApiRole(input);
  const id = randomUUID();
  const now = new Date().toISOString();
  await db.prepare(
    "INSERT INTO roles (id, name, description, is_owner, role_kind, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
  ).run(id, input.name, input.description ?? "", 0, "api", now, now);
  return requireRole(db, id);
}

export async function createAdminRole(db: ApiagexDatabase, input: CreateRoleInput): Promise<RoleRecord> {
  validateAdminRole(input);
  const id = randomUUID();
  const now = new Date().toISOString();
  await db.prepare(
    "INSERT INTO roles (id, name, description, is_owner, role_kind, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
  ).run(id, input.name, input.description ?? "", 0, "admin", now, now);
  return requireRole(db, id);
}

export async function listRoles(db: ApiagexDatabase): Promise<RoleRecord[]> {
  const rows = await db.prepare(roleSelectSql("WHERE role_kind = 'api' ORDER BY created_at ASC")).all<RoleRow>();
  return rows.map(rowToRole);
}

export async function listAdminRoles(db: ApiagexDatabase): Promise<RoleRecord[]> {
  const rows = await db
    .prepare(roleSelectSql("WHERE role_kind = 'admin' ORDER BY is_owner DESC, created_at ASC"))
    .all<RoleRow>();
  return rows.map(rowToRole);
}

export async function getRoleById(db: ApiagexDatabase, id: string): Promise<RoleRecord | undefined> {
  const row = await db.prepare(roleSelectSql("WHERE id = ?")).get<RoleRow>(id);
  return row ? rowToRole(row) : undefined;
}

function validateApiRole(input: CreateRoleInput): void {
  validateRoleName(input);
  if (input.name === "owner") throw new Error("ROLE_OWNER_RESERVED");
  if (adminRoleNames.has(input.name)) throw new Error("ROLE_ADMIN_RESERVED");
}

function validateAdminRole(input: CreateRoleInput): void {
  validateRoleName(input);
  if (input.name === "owner") throw new Error("ROLE_OWNER_RESERVED");
}

function validateRoleName(input: CreateRoleInput): void {
  if (!roleNamePattern.test(input.name)) throw new Error("ROLE_NAME_INVALID");
}

async function requireRole(db: ApiagexDatabase, id: string): Promise<RoleRecord> {
  const role = await getRoleById(db, id);
  if (!role) throw new Error("ROLE_NOT_FOUND");
  return role;
}

function rowToRole(row: RoleRow): RoleRecord {
  return { ...row, isOwner: Boolean(row.isOwner) };
}

function roleSelectSql(suffix: string): string {
  return `SELECT id, name, description, is_owner as isOwner, role_kind as roleKind, created_at as createdAt, updated_at as updatedAt FROM roles ${suffix}`;
}
