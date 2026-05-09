export type AdminRoute =
  | "dashboard"
  | "schemas"
  | "entries"
  | "apis"
  | "roles"
  | "users"
  | "settings"
  | "docs";

export type AdminNavItem = {
  label: string;
  route: AdminRoute;
};
