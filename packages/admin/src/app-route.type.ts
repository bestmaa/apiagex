export type AdminRoute =
  | "dashboard"
  | "schemas"
  | "entries"
  | "apis"
  | "users"
  | "settings"
  | "settings/admin-roles"
  | "settings/content-roles"
  | "settings/api-permissions"
  | "settings/api-tokens"
  | "settings/api-docs"
  | "settings/webhooks"
  | "settings/realtime"
  | "docs/webhooks"
  | "docs/realtime"
  | "docs";

export type AdminNavItem = {
  label: string;
  route: AdminRoute;
};

export type AdminSubnavItem = AdminNavItem & {
  description: string;
};
