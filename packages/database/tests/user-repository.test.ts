import { describe, expect, it } from "vitest";
import {
  createRole,
  createUser,
  getUserById,
  listUsers,
  migrateMvpDatabase,
  openSqliteDatabase,
} from "../src/index.js";

describe("user repository", () => {
  it("creates users and assigns one role", () => {
    const db = openMigratedDb();
    const role = createRole(db, { name: "editor" });

    const user = createUser(db, {
      email: "Editor@Apiagex.local",
      passwordHash: "hash",
      roleId: role.id,
    });

    expect(user.email).toBe("editor@apiagex.local");
    expect(user.roleName).toBe("editor");
    expect(user.roleKind).toBe("api");
    expect(listUsers(db)).toHaveLength(1);
  });

  it("requires a valid role", () => {
    const db = openMigratedDb();

    expect(() =>
      createUser(db, {
        email: "user@apiagex.local",
        passwordHash: "hash",
        roleId: "missing",
      }),
    ).toThrow("ROLE_NOT_FOUND");
  });

  it("requires an API role", () => {
    const db = openMigratedDb();
    const now = new Date().toISOString();
    db.prepare(
      "INSERT INTO roles (id, name, description, is_owner, role_kind, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ).run("role_admin", "admin", "Admin", 0, "admin", now, now);

    expect(() =>
      createUser(db, {
        email: "admin@apiagex.local",
        passwordHash: "hash",
        roleId: "role_admin",
      }),
    ).toThrow("ROLE_API_REQUIRED");
  });

  it("lists and reads API users only", () => {
    const db = openMigratedDb();
    const apiRole = createRole(db, { name: "reader" });
    const now = new Date().toISOString();
    db.prepare(
      "INSERT INTO roles (id, name, description, is_owner, role_kind, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ).run("role_owner", "owner", "Owner", 1, "admin", now, now);
    db.prepare(
      "INSERT INTO users (id, email, password_hash, role_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
    ).run("user_owner", "owner@apiagex.local", "hash", "role_owner", now, now);

    const apiUser = createUser(db, {
      email: "reader@apiagex.local",
      passwordHash: "hash",
      roleId: apiRole.id,
    });

    expect(listUsers(db).map((user) => user.email)).toEqual(["reader@apiagex.local"]);
    expect(getUserById(db, apiUser.id)?.email).toBe("reader@apiagex.local");
    expect(getUserById(db, "user_owner")).toBeUndefined();
  });
});

function openMigratedDb() {
  const db = openSqliteDatabase();
  migrateMvpDatabase(db);
  return db;
}
