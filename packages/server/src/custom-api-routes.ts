import { createHash } from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  canRoleAccessCustomApi,
  getCustomApiRouteByMethodPath,
  listRoles,
  syncCustomApiRoutes,
  type ApiagexDatabase,
  type SyncCustomApiRouteInput,
} from "@apiagex/database";
import { apiRoleTokenFromRequest, resolveApiRoleCredential } from "./api-role-auth.js";
import { createCustomRouteContext } from "./custom-routes.js";
import type { RegisterApiagexCustomRoutes } from "./custom-routes.type.js";

const customApiPrefix = "/api/custom";
const ignoredMethods = new Set(["HEAD", "OPTIONS"]);
const routeMethods = ["get", "post", "put", "patch", "delete", "options", "head", "all"] as const;

export function registerProjectCustomRoutes(
  server: FastifyInstance,
  database: ApiagexDatabase,
  customRoutes: RegisterApiagexCustomRoutes,
): void {
  server.register(async (customServer) => {
    const discovered: SyncCustomApiRouteInput[] = [];

    customServer.addHook("onRoute", (routeOptions) => {
      for (const method of routeMethodList(routeOptions.method)) {
        if (ignoredMethods.has(method)) continue;
        const path = fullCustomApiPath(String(routeOptions.url));
        discovered.push(customApiRouteInput(method, path));
      }
    });

    customServer.addHook("preHandler", async (request, reply) => authorizeCustomApi(database, request, reply));

    await customRoutes(scopedCustomRouteApp(customServer), createCustomRouteContext(database));
    await syncCustomApiRoutes(database, discovered);
  }, { prefix: customApiPrefix });
}

function scopedCustomRouteApp(server: FastifyInstance): FastifyInstance {
  return new Proxy(server, {
    get(target, property, receiver) {
      if (property === "route") {
        return (options: { url?: string; path?: string; [key: string]: unknown }) => {
          const nextOptions = { ...options };
          if (typeof nextOptions.url === "string") nextOptions.url = localCustomApiPath(nextOptions.url);
          if (typeof nextOptions.path === "string") nextOptions.path = localCustomApiPath(nextOptions.path);
          return target.route(nextOptions as unknown as Parameters<FastifyInstance["route"]>[0]);
        };
      }
      if (typeof property === "string" && routeMethods.includes(property as (typeof routeMethods)[number])) {
        return (path: string, ...args: unknown[]) => {
          const method = target[property as keyof Pick<FastifyInstance, (typeof routeMethods)[number]>] as Function;
          return method.call(target, localCustomApiPath(path), ...args);
        };
      }
      return Reflect.get(target, property, receiver);
    },
  }) as FastifyInstance;
}

export async function authorizeCustomApi(
  database: ApiagexDatabase,
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const method = request.method === "HEAD" ? "GET" : request.method.toUpperCase();
  if (method === "OPTIONS") return;
  const routePath = fullCustomApiPath(routeUrl(request));
  const route = await getCustomApiRouteByMethodPath(database, method, routePath);
  if (!route) {
    reply.code(403).send({ ok: false, error: "CUSTOM_API_PERMISSION_NOT_REGISTERED" });
    return;
  }
  const access = await customApiAccess(database, request, route.id);
  if (!access.allowed) {
    reply.code(403).send({ ok: false, error: access.error ?? "CUSTOM_API_PERMISSION_DENIED" });
  }
}

async function customApiAccess(
  database: ApiagexDatabase,
  request: FastifyRequest,
  routeId: string,
): Promise<{ allowed: boolean; error?: string }> {
  const token = apiRoleTokenFromRequest(request);
  if (token) {
    const credential = await resolveApiRoleCredential(database, token);
    if (!credential) return { allowed: false, error: "API_TOKEN_INVALID" };
    return { allowed: await canRoleAccessCustomApi(database, credential.roleId, routeId) };
  }
  const roleId = request.headers["x-apiagex-role-id"];
  if (!roleId) return { allowed: await canPublicCustomApiAccess(database, routeId) };
  if (Array.isArray(roleId)) return { allowed: false };
  return { allowed: await canRoleAccessCustomApi(database, roleId, routeId) };
}

async function canPublicCustomApiAccess(database: ApiagexDatabase, routeId: string): Promise<boolean> {
  const publicRole = (await listRoles(database)).find((role) => role.name === "public");
  return publicRole ? canRoleAccessCustomApi(database, publicRole.id, routeId) : false;
}

function routeMethodList(method: string | string[]): string[] {
  return (Array.isArray(method) ? method : [method]).map((item) => item.toUpperCase());
}

function customApiRouteInput(method: string, path: string): SyncCustomApiRouteInput {
  const groupName = routeGroupName(path);
  return {
    method,
    path,
    groupName,
    name: routeName(path),
    permissionKey: permissionKey(method, path),
  };
}

function routeUrl(request: FastifyRequest): string {
  const routePattern = (request as { routeOptions?: { url?: string } }).routeOptions?.url;
  if (routePattern && !routePattern.includes("*")) return routePattern;
  return request.url.split("?")[0] ?? "/";
}

function fullCustomApiPath(path: string): string {
  const localPath = localCustomApiPath(path);
  return localPath === "/" ? customApiPrefix : `${customApiPrefix}${localPath}`;
}

function localCustomApiPath(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (cleanPath === customApiPrefix) return "/";
  if (cleanPath.startsWith(`${customApiPrefix}/`)) return cleanPath.slice(customApiPrefix.length);
  return cleanPath;
}

function routeGroupName(path: string): string {
  return humanLabel(routeParts(path).find((part) => !part.startsWith(":")) ?? "custom");
}

function routeName(path: string): string {
  const staticParts = routeParts(path).filter((part) => !part.startsWith(":"));
  return humanLabel(staticParts.at(-1) ?? "custom");
}

function permissionKey(method: string, path: string): string {
  const keyParts = routeParts(path).map((part) => slugSegment(part.startsWith(":") ? part.slice(1) || "param" : part));
  const rawKey = ["custom", ...keyParts, method.toLowerCase()].join(".");
  if (rawKey.length <= 180) return rawKey;
  return `${rawKey.slice(0, 140).replace(/\.+$/g, "")}.${createHash("sha256").update(rawKey).digest("hex").slice(0, 24)}`;
}

function routeParts(path: string): string[] {
  return localCustomApiPath(path).split("/").filter(Boolean);
}

function humanLabel(value: string): string {
  return value
    .replace(/^:/, "")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ") || "Custom";
}

function slugSegment(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "route";
}
