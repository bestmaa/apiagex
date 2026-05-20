import { createHash } from "node:crypto";
import type { ApiagexDatabase } from "./database-adapter.type.js";
import { getCustomApiRouteByMethodPath, listCustomApiRoutes } from "./custom-api-repository.js";
import type { CustomApiRouteRecord, SyncCustomApiRouteInput } from "./custom-api-repository.type.js";
import { listWorkflows } from "./workflow-repository.js";
import type { WorkflowRecord } from "./workflow-repository.type.js";

const customApiPrefix = "/api/custom";
const workflowPermissionPrefix = "workflow.";

export async function syncWorkflowCustomApiRoutes(db: ApiagexDatabase): Promise<CustomApiRouteRecord[]> {
  const now = new Date().toISOString();
  await db.prepare("UPDATE custom_api_routes SET active = 0, updated_at = ? WHERE permission_key LIKE ?")
    .run(now, `${workflowPermissionPrefix}%`);

  for (const workflow of (await listWorkflows(db)).filter((item) => item.active)) {
    const route = workflowCustomApiRouteInput(workflow);
    const existing = await getCustomApiRouteByMethodPath(db, route.method, route.path);
    if (existing && !existing.permissionKey.startsWith(workflowPermissionPrefix)) {
      throw new Error("WORKFLOW_ROUTE_CONFLICT");
    }
    if (existing) {
      await db.prepare(
        "UPDATE custom_api_routes SET name = ?, group_name = ?, permission_key = ?, active = 1, updated_at = ?, last_seen_at = ? WHERE id = ?",
      ).run(route.name, route.groupName, route.permissionKey, now, now, existing.id);
    } else {
      await db.prepare(
        "INSERT INTO custom_api_routes (id, method, path, name, group_name, permission_key, active, created_at, updated_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      ).run(route.permissionKey, route.method, route.path, route.name, route.groupName, route.permissionKey, 1, now, now, now);
    }
  }

  return (await listCustomApiRoutes(db)).filter((route) => route.permissionKey.startsWith(workflowPermissionPrefix));
}

export function workflowCustomApiRouteInput(workflow: WorkflowRecord): SyncCustomApiRouteInput {
  const path = fullCustomApiPath(workflow.path);
  return {
    groupName: "Workflows",
    method: workflow.method.toUpperCase(),
    name: workflow.name,
    path,
    permissionKey: workflowPermissionKey(workflow.method, path),
  };
}

export function workflowPermissionKey(method: string, path: string): string {
  const rawKey = [
    "workflow",
    ...routeParts(path).map(slugSegment),
    method.toLowerCase(),
  ].join(".");
  if (rawKey.length <= 180) return rawKey;
  return `${rawKey.slice(0, 140).replace(/\.+$/g, "")}.${createHash("sha256").update(rawKey).digest("hex").slice(0, 24)}`;
}

function fullCustomApiPath(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (cleanPath === customApiPrefix) return customApiPrefix;
  if (cleanPath.startsWith(`${customApiPrefix}/`)) return cleanPath;
  return `${customApiPrefix}${cleanPath}`;
}

function routeParts(path: string): string[] {
  const cleanPath = path.startsWith(`${customApiPrefix}/`)
    ? path.slice(customApiPrefix.length)
    : path;
  return cleanPath.split("/").filter(Boolean);
}

function slugSegment(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "route";
}
