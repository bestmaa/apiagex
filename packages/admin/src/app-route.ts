import type { AdminNavItem, AdminRoute, AdminSubnavItem } from "./app-route.type";

export const settingsSubnavItems: AdminSubnavItem[] = [
  {
    description: "Control Admin UI permissions.",
    label: "Admin Roles",
    route: "settings/admin-roles",
  },
  {
    description: "Control generated API access.",
    label: "Content Roles",
    route: "settings/content-roles",
  },
  {
    description: "Allow or block each API.",
    label: "API Permissions",
    route: "settings/api-permissions",
  },
  {
    description: "Allow or block custom APIs.",
    label: "Custom API Permissions",
    route: "settings/custom-api-permissions",
  },
  {
    description: "Create tokens for API roles.",
    label: "API Tokens",
    route: "settings/api-tokens",
  },
  {
    description: "Publish Swagger/OpenAPI docs.",
    label: "API Docs",
    route: "settings/api-docs",
  },
  {
    description: "Send content change events.",
    label: "Webhooks",
    route: "settings/webhooks",
  },
  {
    description: "Enable live client screens.",
    label: "Realtime API",
    route: "settings/realtime",
  },
  {
    description: "Build no-code custom APIs.",
    label: "Workflows",
    route: "settings/workflows",
  },
];

const standaloneRoutes: AdminRoute[] = [
  "dashboard",
  "schemas",
  "entries",
  "apis",
  "users",
  "settings",
  "docs",
  "docs/webhooks",
  "docs/realtime",
];
const settingsRoutes = settingsSubnavItems.map((item) => item.route);
const allRoutes: AdminRoute[] = [...standaloneRoutes, ...settingsRoutes];

export function readAdminRoute(hash: string): AdminRoute {
  const nextRoute = hash.replace("#", "");
  if (nextRoute === "roles") return "settings/content-roles";
  return allRoutes.includes(nextRoute as AdminRoute) ? nextRoute as AdminRoute : "dashboard";
}

export function activeNavRoute(route: AdminRoute): AdminRoute {
  if (route.startsWith("docs/")) return "docs";
  return isSettingsRoute(route) ? "settings" : route;
}

export function isSettingsRoute(route: AdminRoute): boolean {
  return route === "settings" || route.startsWith("settings/");
}

export function isRouteActive(route: AdminRoute, item: AdminNavItem): boolean {
  return activeNavRoute(route) === item.route;
}
