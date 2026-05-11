export const MVP_MIGRATION_ID = "001_mvp_foundation";

export { MVP_ADDITIVE_MIGRATIONS_SQL } from "./migrations-additive.js";

export const MVP_TABLES = [
  "migrations",
  "roles",
  "users",
  "schemas",
  "fields",
  "entries",
  "permissions",
  "admin_permissions",
  "api_tokens",
  "webhooks",
  "webhook_events",
  "webhook_deliveries",
  "realtime_configs",
  "realtime_events",
  "realtime_sessions",
] as const;

export const MVP_FOUNDATION_SQL = `
CREATE TABLE IF NOT EXISTS migrations (
  id TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  is_owner INTEGER NOT NULL DEFAULT 0,
  role_kind TEXT NOT NULL DEFAULT 'api',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role_id TEXT NOT NULL REFERENCES roles(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS schemas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS fields (
  id TEXT PRIMARY KEY,
  schema_id TEXT NOT NULL REFERENCES schemas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  type TEXT NOT NULL,
  relation_schema_id TEXT REFERENCES schemas(id),
  relation_type TEXT,
  required INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL,
  UNIQUE(schema_id, slug)
);

CREATE TABLE IF NOT EXISTS entries (
  id TEXT PRIMARY KEY,
  schema_id TEXT NOT NULL REFERENCES schemas(id) ON DELETE CASCADE,
  data_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY,
  role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  schema_id TEXT NOT NULL REFERENCES schemas(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  allowed INTEGER NOT NULL DEFAULT 0,
  UNIQUE(role_id, schema_id, action)
);

CREATE TABLE IF NOT EXISTS admin_permissions (
  id TEXT PRIMARY KEY,
  role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  allowed INTEGER NOT NULL DEFAULT 0,
  UNIQUE(role_id, action)
);

CREATE TABLE IF NOT EXISTS api_tokens (
  id TEXT PRIMARY KEY,
  role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  token_prefix TEXT NOT NULL,
  created_at TEXT NOT NULL,
  last_used_at TEXT,
  revoked_at TEXT
);

CREATE TABLE IF NOT EXISTS webhooks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  events_json TEXT NOT NULL,
  schema_id TEXT REFERENCES schemas(id) ON DELETE SET NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  schema_id TEXT NOT NULL,
  schema_slug TEXT NOT NULL,
  entry_id TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  next_retry_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES webhook_events(id) ON DELETE CASCADE,
  webhook_id TEXT NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  status TEXT NOT NULL,
  status_code INTEGER,
  response_body TEXT,
  error TEXT,
  attempt INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  next_retry_at TEXT
);

CREATE TABLE IF NOT EXISTS realtime_configs (
  schema_id TEXT PRIMARY KEY REFERENCES schemas(id) ON DELETE CASCADE,
  enabled INTEGER NOT NULL DEFAULT 0,
  events_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS realtime_events (
  sequence INTEGER PRIMARY KEY AUTOINCREMENT,
  id TEXT NOT NULL UNIQUE,
  message_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  schema_id TEXT NOT NULL REFERENCES schemas(id) ON DELETE CASCADE,
  schema_slug TEXT NOT NULL,
  entry_id TEXT NOT NULL,
  entry_json TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS realtime_sessions (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  token_prefix TEXT NOT NULL,
  role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  schema_id TEXT NOT NULL REFERENCES schemas(id) ON DELETE CASCADE,
  schema_slug TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT
);
`;
