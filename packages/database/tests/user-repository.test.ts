import { describe, expect, it } from "vitest";
import {
  createRole,
  createUser,
  getUserById,
  listUsers,
  openMigratedSqliteAdapter,
} from "../src/index.js";

describe("user repository", () => {
  it("creates users and assigns one role", async () => {
    const db = openMigratedSqliteAdapter();
    const role = await createRole(db, { name: "editor" });

    const user = await createUser(db, {
      email: "Editor@Apiagex.local",
      passwordHash: "hash",
      roleId: role.id,
    });

    expect(user.email).toBe("editor@apiagex.local");
    expect(user.roleName).toBe("editor");
    expect(user.roleKind).toBe("api");
    expect(await listUsers(db)).toHaveLength(1);
  });

  it("requires a valid role", async () => {
    const db = openMigratedSqliteAdapter();

    await expect(
      createUser(db, {
        email: "user@apiagex.local",
        passwordHash: "hash",
        roleId: "missing",
      }),
    ).rejects.toThrow("ROLE_NOT_FOUND");
  });

  it("requires an API role", async () => {
    const db = openMigratedSqliteAdapter();
    const now = new Date().toISOString();
    await db.prepare(
      "INSERT INTO roles (id, name, description, is_owner, role_kind, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ).run("role_admin", "admin", "Admin", 0, "admin", now, now);

    await expect(
      createUser(db, {
        email: "admin@apiagex.local",
        passwordHash: "hash",
        roleId: "role_admin",
      }),
    ).rejects.toThrow("ROLE_API_REQUIRED");
  });

  it("lists and reads API users only", async () => {
    const db = openMigratedSqliteAdapter();
    const apiRole = await createRole(db, { name: "reader" });
    const now = new Date().toISOString();
    await db.prepare(
      "INSERT INTO roles (id, name, description, is_owner, role_kind, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ).run("role_owner", "owner", "Owner", 1, "admin", now, now);
    await db.prepare(
      "INSERT INTO users (id, email, password_hash, role_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
    ).run("user_owner", "owner@apiagex.local", "hash", "role_owner", now, now);

    const apiUser = await createUser(db, {
      email: "reader@apiagex.local",
      passwordHash: "hash",
      roleId: apiRole.id,
    });

    expect((await listUsers(db)).map((user) => user.email)).toEqual(["reader@apiagex.local"]);
    expect((await getUserById(db, apiUser.id))?.email).toBe("reader@apiagex.local");
    expect(await getUserById(db, "user_owner")).toBeUndefined();
  });
});
