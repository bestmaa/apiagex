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
  | "settings/custom-api-permissions"
  | "settings/api-tokens"
  | "settings/api-docs"
  | "settings/webhooks"
  | "settings/realtime"
  | "settings/workflows"
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
