import { createHash, randomUUID } from "node:crypto";
import type { SqliteDatabase } from "@apiagex/database";
import type {
  OwnerBootstrapInput,
  OwnerBootstrapResult,
  OwnerLoginResult,
} from "./owner-bootstrap.type.js";

const OWNER_ROLE_ID = "role_owner";
const adminRoleCatalog = [
  [OWNER_ROLE_ID, "owner", "System owner", true],
  ["role_admin", "admin", "Admin panel administrator", false],
  ["role_schema_manager", "schema-manager", "Schema manager", false],
  ["role_user_manager", "user-manager", "User manager", false],
] as const;
const apiRoleCatalog = [
  ["role_api_reader", "reader", "List reader"],
  ["role_api_single_reader", "single-reader", "Single entry reader"],
  ["role_api_writer", "writer", "Content writer"],
  ["role_api_editor", "editor", "Content editor"],
  ["role_api_public", "public", "Public API role"],
] as const;
const defaultAdminPermissions = {
  admin: ["schemas", "entries", "apiRoles", "apiUsers", "settings"],
  "schema-manager": ["schemas", "entries"],
  "user-manager": ["apiRoles", "apiUsers"],
} as const;

export function bootstrapOwner(
  db: SqliteDatabase,
  input: OwnerBootstrapInput,
): OwnerBootstrapResult {
  const email = input.email.trim().toLowerCase();
  if (!email.includes("@")) {
    throw new Error("OWNER_EMAIL_INVALID");
  }
  if (input.password.length < 8) {
    throw new Error("OWNER_PASSWORD_TOO_SHORT");
  }

  const ownerCount = db
    .prepare(
      "SELECT COUNT(*) as count FROM users JOIN roles ON roles.id = users.role_id WHERE roles.is_owner = 1",
    )
    .get() as {
    count: number;
  };
  if (ownerCount.count > 0) {
    throw new Error("OWNER_ALREADY_BOOTSTRAPPED");
  }

  const now = new Date().toISOString();
  const userId = randomUUID();
  seedDefaultRoles(db, now);
  seedDefaultAdminPermissions(db);
  db.prepare(
    "INSERT INTO users (id, email, password_hash, role_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
  ).run(userId, email, hashPassword(input.password), OWNER_ROLE_ID, now, now);

  return {
    ok: true,
    created: true,
    user: { id: userId, email, role: "owner" },
  };
}

export function loginOwner(
  db: SqliteDatabase,
  input: OwnerBootstrapInput,
): OwnerLoginResult {
  const email = input.email.trim().toLowerCase();
  const row = db
    .prepare(
      "SELECT users.id, users.email, users.password_hash FROM users JOIN roles ON roles.id = users.role_id WHERE users.email = ? AND roles.is_owner = 1",
    )
    .get(email) as { id: string; email: string; password_hash: string } | undefined;

  if (!row || row.password_hash !== hashPassword(input.password)) {
    throw new Error("OWNER_LOGIN_INVALID");
  }

  return {
    ok: true,
    token: `owner:${row.id}`,
    user: { id: row.id, email: row.email, role: "owner" },
  };
}

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

function seedDefaultRoles(db: SqliteDatabase, now: string): void {
  for (const [id, name, description, isOwner] of adminRoleCatalog) {
    seedRole(db, id, name, description, isOwner, "admin", now);
  }
  for (const [id, name, description] of apiRoleCatalog) {
    seedRole(db, id, name, description, false, "api", now);
  }
}

function seedRole(
  db: SqliteDatabase,
  id: string,
  name: string,
  description: string,
  isOwner: boolean,
  roleKind: "admin" | "api",
  now: string,
): void {
  db.prepare(
    `INSERT INTO roles (id, name, description, is_owner, role_kind, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(name) DO UPDATE SET
       description = excluded.description,
       is_owner = excluded.is_owner,
       role_kind = excluded.role_kind,
       updated_at = excluded.updated_at`,
  ).run(id, name, description, isOwner ? 1 : 0, roleKind, now, now);
}

function seedDefaultAdminPermissions(db: SqliteDatabase): void {
  for (const [roleName, actions] of Object.entries(defaultAdminPermissions)) {
    const role = db.prepare("SELECT id FROM roles WHERE name = ? AND role_kind = 'admin'").get(roleName) as
      | { id: string }
      | undefined;
    if (!role) continue;
    for (const action of actions) {
      db.prepare(
        `INSERT INTO admin_permissions (id, role_id, action, allowed)
         VALUES (?, ?, ?, 1)
         ON CONFLICT(role_id, action) DO UPDATE SET allowed = excluded.allowed`,
      ).run(`admin_permission_${roleName}_${action}`, role.id, action);
    }
  }
}
