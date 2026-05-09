import { randomUUID } from "node:crypto";
import type { SqliteDatabase } from "./sqlite.js";
import { getRoleById } from "./role-repository.js";
import { getSchemaById } from "./schema-repository.js";
import type {
  PermissionAction,
  PermissionRecord,
  SetPermissionInput,
} from "./permission-repository.type.js";

type PermissionRow = Omit<PermissionRecord, "allowed"> & { allowed: number };

const permissionActions: PermissionAction[] = [
  "getAll",
  "get",
  "create",
  "update",
  "delete",
  "manage",
];

export function setPermission(
  db: SqliteDatabase,
  input: SetPermissionInput,
): PermissionRecord {
  validatePermissionInput(db, input);
  const existing = findPermission(db, input.roleId, input.schemaId, input.action);
  if (existing) {
    db.prepare("UPDATE permissions SET allowed = ? WHERE id = ?").run(
      input.allowed ? 1 : 0,
      existing.id,
    );
    return requirePermission(db, existing.id);
  }
  const id = randomUUID();
  db.prepare(
    "INSERT INTO permissions (id, role_id, schema_id, action, allowed) VALUES (?, ?, ?, ?, ?)",
  ).run(id, input.roleId, input.schemaId, input.action, input.allowed ? 1 : 0);
  return requirePermission(db, id);
}

export function listRolePermissions(
  db: SqliteDatabase,
  roleId: string,
): PermissionRecord[] {
  const rows = db
    .prepare(permissionSelectSql("WHERE role_id = ? ORDER BY schema_id ASC, action ASC"))
    .all(roleId) as PermissionRow[];
  return rows.map(rowToPermission);
}

export function canRoleAccess(
  db: SqliteDatabase,
  roleId: string,
  schemaId: string,
  action: PermissionAction,
): boolean {
  const role = getRoleById(db, roleId);
  if (!role) return false;
  if (role.isOwner) return true;
  const manage = findPermission(db, roleId, schemaId, "manage");
  if (manage?.allowed) return true;
  const permission = findPermission(db, roleId, schemaId, action);
  return Boolean(permission?.allowed);
}

function validatePermissionInput(db: SqliteDatabase, input: SetPermissionInput): void {
  if (!permissionActions.includes(input.action)) {
    throw new Error("PERMISSION_ACTION_INVALID");
  }
  if (!getRoleById(db, input.roleId)) {
    throw new Error("ROLE_NOT_FOUND");
  }
  if (!getSchemaById(db, input.schemaId)) {
    throw new Error("SCHEMA_NOT_FOUND");
  }
}

function findPermission(
  db: SqliteDatabase,
  roleId: string,
  schemaId: string,
  action: PermissionAction,
): PermissionRecord | undefined {
  const row = db
    .prepare(permissionSelectSql("WHERE role_id = ? AND schema_id = ? AND action = ?"))
    .get(roleId, schemaId, action) as PermissionRow | undefined;
  return row ? rowToPermission(row) : undefined;
}

function requirePermission(db: SqliteDatabase, id: string): PermissionRecord {
  const row = db.prepare(permissionSelectSql("WHERE id = ?")).get(id) as
    | PermissionRow
    | undefined;
  if (!row) {
    throw new Error("PERMISSION_NOT_FOUND");
  }
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
