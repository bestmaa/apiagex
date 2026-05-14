import { randomUUID } from "node:crypto";
import type { ApiagexDatabase } from "./database-adapter.type.js";
import type {
  AdminPermissionAction,
  AdminPermissionRecord,
  SetAdminPermissionInput,
} from "./admin-permission-repository.type.js";
import { getRoleById } from "./role-repository.js";

type AdminPermissionRow = Omit<AdminPermissionRecord, "allowed"> & { allowed: number };

export const adminPermissionActions: AdminPermissionAction[] = [
  "schemas",
  "entries",
  "apiRoles",
  "apiUsers",
  "settings",
];

export async function setAdminPermission(
  db: ApiagexDatabase,
  input: SetAdminPermissionInput,
): Promise<AdminPermissionRecord> {
  await validateAdminPermissionInput(db, input);
  const existing = await findAdminPermission(db, input.roleId, input.action);
  if (existing) {
    await db.prepare("UPDATE admin_permissions SET allowed = ? WHERE id = ?")
      .run(input.allowed ? 1 : 0, existing.id);
    return requireAdminPermission(db, existing.id);
  }
  const id = randomUUID();
  await db.prepare("INSERT INTO admin_permissions (id, role_id, action, allowed) VALUES (?, ?, ?, ?)")
    .run(id, input.roleId, input.action, input.allowed ? 1 : 0);
  return requireAdminPermission(db, id);
}

export async function listAdminRolePermissions(
  db: ApiagexDatabase,
  roleId: string,
): Promise<AdminPermissionRecord[]> {
  const role = await getRoleById(db, roleId);
  if (role?.isOwner) return ownerPermissions(roleId);
  const rows = await db
    .prepare(adminPermissionSelectSql("WHERE role_id = ? ORDER BY action ASC"))
    .all<AdminPermissionRow>(roleId);
  return rows.map(rowToAdminPermission);
}

export async function canAdminRoleAccess(
  db: ApiagexDatabase,
  roleId: string,
  action: AdminPermissionAction,
): Promise<boolean> {
  const role = await getRoleById(db, roleId);
  if (!role || role.roleKind !== "admin") return false;
  if (role.isOwner) return true;
  return Boolean((await findAdminPermission(db, roleId, action))?.allowed);
}

async function validateAdminPermissionInput(db: ApiagexDatabase, input: SetAdminPermissionInput): Promise<void> {
  if (!adminPermissionActions.includes(input.action)) throw new Error("ADMIN_PERMISSION_ACTION_INVALID");
  const role = await getRoleById(db, input.roleId);
  if (!role) throw new Error("ROLE_NOT_FOUND");
  if (role.roleKind !== "admin") throw new Error("ROLE_ADMIN_REQUIRED");
  if (role.isOwner) throw new Error("ROLE_OWNER_LOCKED");
}

async function findAdminPermission(
  db: ApiagexDatabase,
  roleId: string,
  action: AdminPermissionAction,
): Promise<AdminPermissionRecord | undefined> {
  const row = await db
    .prepare(adminPermissionSelectSql("WHERE role_id = ? AND action = ?"))
    .get<AdminPermissionRow>(roleId, action);
  return row ? rowToAdminPermission(row) : undefined;
}

async function requireAdminPermission(db: ApiagexDatabase, id: string): Promise<AdminPermissionRecord> {
  const row = await db.prepare(adminPermissionSelectSql("WHERE id = ?")).get<AdminPermissionRow>(id);
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
