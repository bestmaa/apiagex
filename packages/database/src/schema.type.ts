export type MvpTableName =
  | "roles"
  | "users"
  | "schemas"
  | "fields"
  | "entries"
  | "permissions"
  | "admin_permissions"
  | "api_tokens"
  | "migrations";

export type MigrationRecord = {
  id: string;
  applied_at: string;
};

export type TableInfoRow = {
  name: string;
};
