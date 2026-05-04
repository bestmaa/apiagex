import { createHash, randomUUID } from "node:crypto";
import type { SqliteDatabase } from "@apiagex/database";
import type {
  OwnerBootstrapInput,
  OwnerBootstrapResult,
} from "./owner-bootstrap.type.js";

const OWNER_ROLE_ID = "role_owner";

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

  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as {
    count: number;
  };
  if (userCount.count > 0) {
    throw new Error("OWNER_ALREADY_BOOTSTRAPPED");
  }

  const now = new Date().toISOString();
  const userId = randomUUID();
  db.prepare(
    "INSERT INTO roles (id, name, description, is_owner, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
  ).run(OWNER_ROLE_ID, "owner", "System owner", 1, now, now);
  db.prepare(
    "INSERT INTO users (id, email, password_hash, role_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
  ).run(userId, email, hashPassword(input.password), OWNER_ROLE_ID, now, now);

  return {
    ok: true,
    created: true,
    user: { id: userId, email, role: "owner" },
  };
}

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}
