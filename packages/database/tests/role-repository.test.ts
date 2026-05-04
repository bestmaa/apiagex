import { describe, expect, it } from "vitest";
import {
  createRole,
  listRoles,
  migrateMvpDatabase,
  openSqliteDatabase,
} from "../src/index.js";

describe("role repository", () => {
  it("creates unlimited non-owner roles", () => {
    const db = openMigratedDb();

    const editor = createRole(db, { name: "editor", description: "Can edit" });
    const viewer = createRole(db, { name: "viewer" });

    expect(editor.name).toBe("editor");
    expect(viewer.isOwner).toBe(false);
    expect(listRoles(db).map((role) => role.name)).toEqual(["editor", "viewer"]);
  });

  it("validates role names and reserves owner", () => {
    const db = openMigratedDb();

    expect(() => createRole(db, { name: "Bad Role" })).toThrow("ROLE_NAME_INVALID");
    expect(() => createRole(db, { name: "owner" })).toThrow("ROLE_OWNER_RESERVED");
  });
});

function openMigratedDb() {
  const db = openSqliteDatabase();
  migrateMvpDatabase(db);
  return db;
}
