import { createHash, randomUUID } from "node:crypto";
import type { ApiagexDatabase } from "@apiagex/database";
import type {
  OwnerBootstrapInput,
  OwnerBootstrapResult,
  OwnerLoginResult,
  OwnerStatusResult,
} from "./owner-bootstrap.type.js";
import { issueOwnerToken } from "./admin-auth.js";

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

export async function bootstrapOwner(
  db: ApiagexDatabase,
  input: OwnerBootstrapInput,
): Promise<OwnerBootstrapResult> {
  const email = input.email.trim().toLowerCase();
  if (!email.includes("@")) throw new Error("OWNER_EMAIL_INVALID");
  if (input.password.length < 8) throw new Error("OWNER_PASSWORD_TOO_SHORT");

  const ownerCount = await db
    .prepare("SELECT COUNT(*) as count FROM users JOIN roles ON roles.id = users.role_id WHERE roles.is_owner = 1")
    .get<{ count: number }>();
  if ((ownerCount?.count ?? 0) > 0) throw new Error("OWNER_ALREADY_BOOTSTRAPPED");

  const now = new Date().toISOString();
  const userId = randomUUID();
  await seedDefaultRoles(db, now);
  await seedDefaultAdminPermissions(db);
  await db.prepare("INSERT INTO users (id, email, password_hash, role_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)")
    .run(userId, email, hashPassword(input.password), OWNER_ROLE_ID, now, now);

  return {
    ok: true,
    created: true,
    token: issueOwnerToken(userId, hashPassword(input.password)),
    user: { id: userId, email, role: "owner" },
  };
}

export async function getOwnerStatus(db: ApiagexDatabase): Promise<OwnerStatusResult> {
  return {
    hasOwner: await ownerExists(db),
    ok: true,
  };
}

export async function loginOwner(db: ApiagexDatabase, input: OwnerBootstrapInput): Promise<OwnerLoginResult> {
  const email = input.email.trim().toLowerCase();
  const row = await db
    .prepare(
      "SELECT users.id, users.email, users.password_hash FROM users JOIN roles ON roles.id = users.role_id WHERE users.email = ? AND roles.is_owner = 1",
    )
    .get<{ id: string; email: string; password_hash: string }>(email);

  if (!row || row.password_hash !== hashPassword(input.password)) throw new Error("OWNER_LOGIN_INVALID");

  return {
    ok: true,
    token: issueOwnerToken(row.id, row.password_hash),
    user: { id: row.id, email: row.email, role: "owner" },
  };
}

async function ownerExists(db: ApiagexDatabase): Promise<boolean> {
  const ownerCount = await db
    .prepare("SELECT COUNT(*) as count FROM users JOIN roles ON roles.id = users.role_id WHERE roles.is_owner = 1")
    .get<{ count: number }>();
  return (ownerCount?.count ?? 0) > 0;
}

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

async function seedDefaultRoles(db: ApiagexDatabase, now: string): Promise<void> {
  for (const [id, name, description, isOwner] of adminRoleCatalog) {
    await seedRole(db, id, name, description, isOwner, "admin", now);
  }
  for (const [id, name, description] of apiRoleCatalog) {
    await seedRole(db, id, name, description, false, "api", now);
  }
}

async function seedRole(
  db: ApiagexDatabase,
  id: string,
  name: string,
  description: string,
  isOwner: boolean,
  roleKind: "admin" | "api",
  now: string,
): Promise<void> {
  const existing = await db.prepare("SELECT id FROM roles WHERE name = ?").get<{ id: string }>(name);
  if (existing) {
    await db.prepare("UPDATE roles SET description = ?, is_owner = ?, role_kind = ?, updated_at = ? WHERE id = ?")
      .run(description, isOwner ? 1 : 0, roleKind, now, existing.id);
    return;
  }
  await db.prepare("INSERT INTO roles (id, name, description, is_owner, role_kind, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(id, name, description, isOwner ? 1 : 0, roleKind, now, now);
}

async function seedDefaultAdminPermissions(db: ApiagexDatabase): Promise<void> {
  for (const [roleName, actions] of Object.entries(defaultAdminPermissions)) {
    const role = await db.prepare("SELECT id FROM roles WHERE name = ? AND role_kind = 'admin'").get<{ id: string }>(roleName);
    if (!role) continue;
    for (const action of actions) {
      const existing = await db.prepare("SELECT id FROM admin_permissions WHERE role_id = ? AND action = ?")
        .get<{ id: string }>(role.id, action);
      if (existing) {
        await db.prepare("UPDATE admin_permissions SET allowed = 1 WHERE id = ?").run(existing.id);
      } else {
        await db.prepare("INSERT INTO admin_permissions (id, role_id, action, allowed) VALUES (?, ?, ?, 1)")
          .run(`admin_permission_${roleName}_${action}`, role.id, action);
      }
    }
  }
}
