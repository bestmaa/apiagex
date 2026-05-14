import { randomUUID } from "node:crypto";
import type { ApiagexDatabase } from "./database-adapter.type.js";
import type {
  PermissionAction,
  PermissionRecord,
  SetPermissionInput,
} from "./permission-repository.type.js";
import { getRoleById } from "./role-repository.js";
import { getSchemaById } from "./schema-repository.js";

type PermissionRow = Omit<PermissionRecord, "allowed"> & { allowed: number };

const permissionActions: PermissionAction[] = ["getAll", "get", "create", "update", "delete", "manage"];

export async function setPermission(
  db: ApiagexDatabase,
  input: SetPermissionInput,
): Promise<PermissionRecord> {
  await validatePermissionInput(db, input);
  const existing = await findPermission(db, input.roleId, input.schemaId, input.action);
  if (existing) {
    await db.prepare("UPDATE permissions SET allowed = ? WHERE id = ?").run(input.allowed ? 1 : 0, existing.id);
    return requirePermission(db, existing.id);
  }
  const id = randomUUID();
  await db.prepare(
    "INSERT INTO permissions (id, role_id, schema_id, action, allowed) VALUES (?, ?, ?, ?, ?)",
  ).run(id, input.roleId, input.schemaId, input.action, input.allowed ? 1 : 0);
  return requirePermission(db, id);
}

export async function listRolePermissions(db: ApiagexDatabase, roleId: string): Promise<PermissionRecord[]> {
  const rows = await db
    .prepare(permissionSelectSql("WHERE role_id = ? ORDER BY schema_id ASC, action ASC"))
    .all<PermissionRow>(roleId);
  return rows.map(rowToPermission);
}

export async function canRoleAccess(
  db: ApiagexDatabase,
  roleId: string,
  schemaId: string,
  action: PermissionAction,
): Promise<boolean> {
  const role = await getRoleById(db, roleId);
  if (!role || role.roleKind !== "api") return false;
  const manage = await findPermission(db, roleId, schemaId, "manage");
  if (manage?.allowed) return true;
  const permission = await findPermission(db, roleId, schemaId, action);
  return Boolean(permission?.allowed);
}

async function validatePermissionInput(db: ApiagexDatabase, input: SetPermissionInput): Promise<void> {
  if (!permissionActions.includes(input.action)) throw new Error("PERMISSION_ACTION_INVALID");
  const role = await getRoleById(db, input.roleId);
  if (!role) throw new Error("ROLE_NOT_FOUND");
  if (role.roleKind !== "api") throw new Error("ROLE_API_REQUIRED");
  if (!(await getSchemaById(db, input.schemaId))) throw new Error("SCHEMA_NOT_FOUND");
}

async function findPermission(
  db: ApiagexDatabase,
  roleId: string,
  schemaId: string,
  action: PermissionAction,
): Promise<PermissionRecord | undefined> {
  const row = await db
    .prepare(permissionSelectSql("WHERE role_id = ? AND schema_id = ? AND action = ?"))
    .get<PermissionRow>(roleId, schemaId, action);
  return row ? rowToPermission(row) : undefined;
}

async function requirePermission(db: ApiagexDatabase, id: string): Promise<PermissionRecord> {
  const row = await db.prepare(permissionSelectSql("WHERE id = ?")).get<PermissionRow>(id);
  if (!row) throw new Error("PERMISSION_NOT_FOUND");
  return rowToPermission(row);
}

function rowToPermission(row: PermissionRow): PermissionRecord {
  return {
    id: row.id,
    roleId: row.roleId,
    schemaId: row.schemaId,
    action: row.action,
    allowed: Boolean(row.allowed),
  };
}

function permissionSelectSql(suffix: string): string {
  return `SELECT id, role_id as roleId, schema_id as schemaId, action, allowed FROM permissions ${suffix}`;
}
