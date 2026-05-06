export type AdminRoute = "dashboard" | "schemas" | "entries" | "apis" | "roles" | "users" | "docs";

export type AdminNavItem = {
  label: string;
  route: AdminRoute;
};
