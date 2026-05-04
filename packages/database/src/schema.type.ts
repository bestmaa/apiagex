export type MvpTableName =
  | "roles"
  | "users"
  | "schemas"
  | "fields"
  | "entries"
  | "permissions"
  | "migrations";

export type MigrationRecord = {
  id: string;
  applied_at: string;
};

export type TableInfoRow = {
  name: string;
};
