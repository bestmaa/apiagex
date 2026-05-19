import { randomUUID } from "node:crypto";
import type { ApiagexDatabase } from "./database-adapter.type.js";
import { getRoleById } from "./role-repository.js";
import type {
  CustomApiPermissionEventRecord,
  CustomApiPermissionRecord,
  CustomApiRouteRecord,
  RecordCustomApiPermissionEventInput,
  SetCustomApiPermissionInput,
  SyncCustomApiRouteInput,
  UpdateCustomApiRouteMetadataInput,
} from "./custom-api-repository.type.js";

type CustomApiRouteRow = Omit<CustomApiRouteRecord, "active"> & { active: number };
type CustomApiPermissionRow = Omit<CustomApiPermissionRecord, "allowed"> & { allowed: number };
type CustomApiPermissionEventRow = Omit<CustomApiPermissionEventRecord, "allowed"> & { allowed: number };

let customApiPermissionEventClock = 0;

export async function syncCustomApiRoutes(
  db: ApiagexDatabase,
  routes: SyncCustomApiRouteInput[],
): Promise<CustomApiRouteRecord[]> {
  const now = new Date().toISOString();
  await db.prepare("UPDATE custom_api_routes SET active = 0, updated_at = ?").run(now);
  for (const route of uniqueRoutes(routes)) {
    const existing = await findCustomApiRoute(db, route.method, route.path);
    if (existing) {
      await db.prepare(
        "UPDATE custom_api_routes SET permission_key = ?, active = 1, updated_at = ?, last_seen_at = ? WHERE id = ?",
      ).run(route.permissionKey, now, now, existing.id);
    } else {
      await db.prepare(
        "INSERT INTO custom_api_routes (id, method, path, name, group_name, permission_key, active, created_at, updated_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      ).run(route.permissionKey, route.method, route.path, route.name, route.groupName, route.permissionKey, 1, now, now, now);
    }
  }
  return listCustomApiRoutes(db);
}

export async function listCustomApiRoutes(db: ApiagexDatabase): Promise<CustomApiRouteRecord[]> {
  const rows = await db
    .prepare(customApiRouteSelectSql("ORDER BY active DESC, group_name ASC, path ASC, method ASC"))
    .all<CustomApiRouteRow>();
  return rows.map(rowToCustomApiRoute);
}

export async function updateCustomApiRouteMetadata(
  db: ApiagexDatabase,
  input: UpdateCustomApiRouteMetadataInput,
): Promise<CustomApiRouteRecord> {
  const name = input.name.trim();
  const groupName = input.groupName.trim();
  if (!name) throw new Error("CUSTOM_API_ROUTE_NAME_REQUIRED");
  if (!groupName) throw new Error("CUSTOM_API_ROUTE_GROUP_REQUIRED");
  const existing = await getCustomApiRouteById(db, input.id);
  if (!existing) throw new Error("CUSTOM_API_ROUTE_NOT_FOUND");
  await db.prepare("UPDATE custom_api_routes SET name = ?, group_name = ?, updated_at = ? WHERE id = ?")
    .run(name, groupName, new Date().toISOString(), input.id);
  return requireCustomApiRoute(db, input.id);
}

export async function deleteInactiveCustomApiRoute(db: ApiagexDatabase, id: string): Promise<void> {
  const existing = await getCustomApiRouteById(db, id);
  if (!existing) throw new Error("CUSTOM_API_ROUTE_NOT_FOUND");
  if (existing.active) throw new Error("CUSTOM_API_ROUTE_ACTIVE");
  await db.prepare("DELETE FROM custom_api_routes WHERE id = ?").run(id);
}

export async function getCustomApiRouteByMethodPath(
  db: ApiagexDatabase,
  method: string,
  path: string,
): Promise<CustomApiRouteRecord | undefined> {
  return findCustomApiRoute(db, method.toUpperCase(), path);
}

export async function setCustomApiPermission(
  db: ApiagexDatabase,
  input: SetCustomApiPermissionInput,
): Promise<CustomApiPermissionRecord> {
  await validateCustomApiPermissionInput(db, input);
  const existing = await findCustomApiPermission(db, input.roleId, input.customApiRouteId);
  if (existing) {
    await db.prepare("UPDATE custom_api_permissions SET allowed = ? WHERE id = ?")
      .run(input.allowed ? 1 : 0, existing.id);
    return requireCustomApiPermission(db, existing.id);
  }
  const id = randomUUID();
  await db.prepare(
    "INSERT INTO custom_api_permissions (id, role_id, custom_api_route_id, allowed) VALUES (?, ?, ?, ?)",
  ).run(id, input.roleId, input.customApiRouteId, input.allowed ? 1 : 0);
  return requireCustomApiPermission(db, id);
}

export async function listCustomApiPermissions(
  db: ApiagexDatabase,
  roleId: string,
): Promise<CustomApiPermissionRecord[]> {
  const rows = await db
    .prepare(customApiPermissionSelectSql("WHERE role_id = ? ORDER BY custom_api_route_id ASC"))
    .all<CustomApiPermissionRow>(roleId);
  return rows.map(rowToCustomApiPermission);
}

export async function listCustomApiPermissionEvents(
  db: ApiagexDatabase,
  customApiRouteId?: string,
): Promise<CustomApiPermissionEventRecord[]> {
  const suffix = customApiRouteId
    ? "WHERE custom_api_route_id = ? ORDER BY created_at DESC LIMIT 100"
    : "ORDER BY created_at DESC LIMIT 100";
  const statement = db.prepare(customApiPermissionEventSelectSql(suffix));
  const rows = customApiRouteId
    ? await statement.all<CustomApiPermissionEventRow>(customApiRouteId)
    : await statement.all<CustomApiPermissionEventRow>();
  return rows.map(rowToCustomApiPermissionEvent);
}

export async function recordCustomApiPermissionEvent(
  db: ApiagexDatabase,
  input: RecordCustomApiPermissionEventInput,
): Promise<CustomApiPermissionEventRecord> {
  await validateCustomApiPermissionInput(db, input);
  const id = randomUUID();
  const now = nextCustomApiPermissionEventTimestamp();
  await db.prepare(
    "INSERT INTO custom_api_permission_events (id, role_id, custom_api_route_id, allowed, actor_id, actor_email, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
  ).run(id, input.roleId, input.customApiRouteId, input.allowed ? 1 : 0, input.actorId, input.actorEmail, now);
  return requireCustomApiPermissionEvent(db, id);
}

export async function canRoleAccessCustomApi(
  db: ApiagexDatabase,
  roleId: string,
  customApiRouteId: string,
): Promise<boolean> {
  const role = await getRoleById(db, roleId);
  if (!role || role.roleKind !== "api") return false;
  const route = await getCustomApiRouteById(db, customApiRouteId);
  if (!route?.active) return false;
  const permission = await findCustomApiPermission(db, roleId, customApiRouteId);
  return Boolean(permission?.allowed);
}

async function validateCustomApiPermissionInput(
  db: ApiagexDatabase,
  input: SetCustomApiPermissionInput,
): Promise<void> {
  const role = await getRoleById(db, input.roleId);
  if (!role) throw new Error("ROLE_NOT_FOUND");
  if (role.roleKind !== "api") throw new Error("ROLE_API_REQUIRED");
  if (!(await getCustomApiRouteById(db, input.customApiRouteId))) throw new Error("CUSTOM_API_ROUTE_NOT_FOUND");
}

async function getCustomApiRouteById(
  db: ApiagexDatabase,
  id: string,
): Promise<CustomApiRouteRecord | undefined> {
  const row = await db.prepare(customApiRouteSelectSql("WHERE id = ?")).get<CustomApiRouteRow>(id);
  return row ? rowToCustomApiRoute(row) : undefined;
}

async function requireCustomApiRoute(db: ApiagexDatabase, id: string): Promise<CustomApiRouteRecord> {
  const route = await getCustomApiRouteById(db, id);
  if (!route) throw new Error("CUSTOM_API_ROUTE_NOT_FOUND");
  return route;
}

async function findCustomApiRoute(
  db: ApiagexDatabase,
  method: string,
  path: string,
): Promise<CustomApiRouteRecord | undefined> {
  const row = await db
    .prepare(customApiRouteSelectSql("WHERE method = ? AND path = ?"))
    .get<CustomApiRouteRow>(method.toUpperCase(), path);
  return row ? rowToCustomApiRoute(row) : undefined;
}

async function findCustomApiPermission(
  db: ApiagexDatabase,
  roleId: string,
  customApiRouteId: string,
): Promise<CustomApiPermissionRecord | undefined> {
  const row = await db
    .prepare(customApiPermissionSelectSql("WHERE role_id = ? AND custom_api_route_id = ?"))
    .get<CustomApiPermissionRow>(roleId, customApiRouteId);
  return row ? rowToCustomApiPermission(row) : undefined;
}

async function requireCustomApiPermission(
  db: ApiagexDatabase,
  id: string,
): Promise<CustomApiPermissionRecord> {
  const row = await db.prepare(customApiPermissionSelectSql("WHERE id = ?")).get<CustomApiPermissionRow>(id);
  if (!row) throw new Error("CUSTOM_API_PERMISSION_NOT_FOUND");
  return rowToCustomApiPermission(row);
}

async function requireCustomApiPermissionEvent(
  db: ApiagexDatabase,
  id: string,
): Promise<CustomApiPermissionEventRecord> {
  const row = await db.prepare(customApiPermissionEventSelectSql("WHERE id = ?")).get<CustomApiPermissionEventRow>(id);
  if (!row) throw new Error("CUSTOM_API_PERMISSION_EVENT_NOT_FOUND");
  return rowToCustomApiPermissionEvent(row);
}

function uniqueRoutes(routes: SyncCustomApiRouteInput[]): SyncCustomApiRouteInput[] {
  return [...new Map(routes.map((route) => [`${route.method}:${route.path}`, route])).values()];
}

function rowToCustomApiRoute(row: CustomApiRouteRow): CustomApiRouteRecord {
  return { ...row, active: Boolean(row.active) };
}

function rowToCustomApiPermission(row: CustomApiPermissionRow): CustomApiPermissionRecord {
  return { ...row, allowed: Boolean(row.allowed) };
}

function rowToCustomApiPermissionEvent(row: CustomApiPermissionEventRow): CustomApiPermissionEventRecord {
  return { ...row, allowed: Boolean(row.allowed) };
}

function customApiRouteSelectSql(suffix: string): string {
  return `SELECT id, method, path, name, group_name as groupName, permission_key as permissionKey, active, created_at as createdAt, updated_at as updatedAt, last_seen_at as lastSeenAt FROM custom_api_routes ${suffix}`;
}

function customApiPermissionSelectSql(suffix: string): string {
  return `SELECT id, role_id as roleId, custom_api_route_id as customApiRouteId, allowed FROM custom_api_permissions ${suffix}`;
}

function customApiPermissionEventSelectSql(suffix: string): string {
  return `SELECT id, role_id as roleId, custom_api_route_id as customApiRouteId, allowed, actor_id as actorId, actor_email as actorEmail, created_at as createdAt FROM custom_api_permission_events ${suffix}`;
}

function nextCustomApiPermissionEventTimestamp(): string {
  const now = Date.now();
  customApiPermissionEventClock = Math.max(customApiPermissionEventClock + 1, now);
  return new Date(customApiPermissionEventClock).toISOString();
}
