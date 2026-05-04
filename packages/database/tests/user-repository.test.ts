import { describe, expect, it } from "vitest";
import {
  createRole,
  createUser,
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
});

function openMigratedDb() {
  const db = openSqliteDatabase();
  migrateMvpDatabase(db);
  return db;
}
