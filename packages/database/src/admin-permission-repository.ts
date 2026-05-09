import { randomUUID } from "node:crypto";
import type { SqliteDatabase } from "./sqlite.js";
import { getRoleById } from "./role-repository.js";
import type {
  AdminPermissionAction,
  AdminPermissionRecord,
  SetAdminPermissionInput,
} from "./admin-permission-repository.type.js";

type AdminPermissionRow = Omit<AdminPermissionRecord, "allowed"> & { allowed: number };

export const adminPermissionActions: AdminPermissionAction[] = [
  "schemas",
  "entries",
  "apiRoles",
  "apiUsers",
  "settings",
];

export function setAdminPermission(
  db: SqliteDatabase,
  input: SetAdminPermissionInput,
): AdminPermissionRecord {
  validateAdminPermissionInput(db, input);
  const existing = findAdminPermission(db, input.roleId, input.action);
  if (existing) {
    db.prepare("UPDATE admin_permissions SET allowed = ? WHERE id = ?").run(
      input.allowed ? 1 : 0,
      existing.id,
    );
    return requireAdminPermission(db, existing.id);
  }
  const id = randomUUID();
  db.prepare(
    "INSERT INTO admin_permissions (id, role_id, action, allowed) VALUES (?, ?, ?, ?)",
  ).run(id, input.roleId, input.action, input.allowed ? 1 : 0);
  return requireAdminPermission(db, id);
}

export function listAdminRolePermissions(
  db: SqliteDatabase,
  roleId: string,
): AdminPermissionRecord[] {
  const role = getRoleById(db, roleId);
  if (role?.isOwner) return ownerPermissions(roleId);
  const rows = db
    .prepare(adminPermissionSelectSql("WHERE role_id = ? ORDER BY action ASC"))
    .all(roleId) as AdminPermissionRow[];
  return rows.map(rowToAdminPermission);
}

export function canAdminRoleAccess(
  db: SqliteDatabase,
  roleId: string,
  action: AdminPermissionAction,
): boolean {
  const role = getRoleById(db, roleId);
  if (!role || role.roleKind !== "admin") return false;
  if (role.isOwner) return true;
  return Boolean(findAdminPermission(db, roleId, action)?.allowed);
}

function validateAdminPermissionInput(db: SqliteDatabase, input: SetAdminPermissionInput): void {
  if (!adminPermissionActions.includes(input.action)) throw new Error("ADMIN_PERMISSION_ACTION_INVALID");
  const role = getRoleById(db, input.roleId);
  if (!role) throw new Error("ROLE_NOT_FOUND");
  if (role.roleKind !== "admin") throw new Error("ROLE_ADMIN_REQUIRED");
  if (role.isOwner) throw new Error("ROLE_OWNER_LOCKED");
}

function findAdminPermission(
  db: SqliteDatabase,
  roleId: string,
  action: AdminPermissionAction,
): AdminPermissionRecord | undefined {
  const row = db
    .prepare(adminPermissionSelectSql("WHERE role_id = ? AND action = ?"))
    .get(roleId, action) as AdminPermissionRow | undefined;
  return row ? rowToAdminPermission(row) : undefined;
}

function requireAdminPermission(db: SqliteDatabase, id: string): AdminPermissionRecord {
  const row = db.prepare(adminPermissionSelectSql("WHERE id = ?")).get(id) as
    | AdminPermissionRow
    | undefined;
  if (!row) throw new Error("ADMIN_PERMISSION_NOT_FOUND");
  return rowToAdminPermission(row);
}

function ownerPermissions(roleId: string): AdminPermissionRecord[] {
  return adminPermissionActions.map((action) => ({
    id: `${roleId}:${action}`,
    roleId,
    action,
    allowed: true,
  }));
}

function rowToAdminPermission(row: AdminPermissionRow): AdminPermissionRecord {
  return { id: row.id, roleId: row.roleId, action: row.action, allowed: Boolean(row.allowed) };
}

function adminPermissionSelectSql(suffix: string): string {
  return `SELECT id, role_id as roleId, action, allowed FROM admin_permissions ${suffix}`;
}
