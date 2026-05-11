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
    description: "Send content change events.",
    label: "Webhooks",
    route: "settings/webhooks",
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
];
const settingsRoutes = settingsSubnavItems.map((item) => item.route);
const allRoutes: AdminRoute[] = [...standaloneRoutes, ...settingsRoutes];

export function readAdminRoute(hash: string): AdminRoute {
  const nextRoute = hash.replace("#", "");
  if (nextRoute === "roles") return "settings/content-roles";
  return allRoutes.includes(nextRoute as AdminRoute) ? nextRoute as AdminRoute : "dashboard";
}

export function activeNavRoute(route: AdminRoute): AdminRoute {
  return isSettingsRoute(route) ? "settings" : route;
}

export function isSettingsRoute(route: AdminRoute): boolean {
  return route === "settings" || route.startsWith("settings/");
}

export function isRouteActive(route: AdminRoute, item: AdminNavItem): boolean {
  return activeNavRoute(route) === item.route;
}
