export type AdminRoute =
  | "dashboard"
  | "schemas"
  | "entries"
  | "apis"
  | "users"
  | "settings"
  | "settings/admin-roles"
  | "settings/content-roles"
  | "docs";

export type AdminNavItem = {
  label: string;
  route: AdminRoute;
};

export type AdminSubnavItem = AdminNavItem & {
  description: string;
};
