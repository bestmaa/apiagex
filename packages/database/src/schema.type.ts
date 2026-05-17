export type MvpTableName =
  | "roles"
  | "users"
  | "schemas"
  | "fields"
  | "entries"
  | "permissions"
  | "app_settings"
  | "admin_permissions"
  | "api_tokens"
  | "webhooks"
  | "webhook_events"
  | "webhook_deliveries"
  | "realtime_configs"
  | "realtime_events"
  | "realtime_sessions"
  | "migrations";

export type MigrationRecord = {
  id: string;
  applied_at: string;
};

export type TableInfoRow = {
  name: string;
};
