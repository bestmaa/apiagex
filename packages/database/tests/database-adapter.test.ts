import { describe, expect, it } from "vitest";
import { openSqliteAdapter } from "../src/index.js";

describe("database adapter boundary", () => {
  it("executes SQLite get, all, run, transaction, and close through the adapter", async () => {
    const db = openSqliteAdapter();

    await db.exec("CREATE TABLE items (id TEXT PRIMARY KEY, name TEXT NOT NULL)");
    const insert = await db.prepare("INSERT INTO items (id, name) VALUES (?, ?)").run("one", "First item");

    expect(db.provider).toBe("sqlite");
    expect(insert.changes).toBe(1);
    await expect(db.prepare("SELECT name FROM items WHERE id = ?").get<{ name: string }>("one")).resolves.toEqual({
      name: "First item",
    });

    await db.transaction(async () => {
      await db.prepare("INSERT INTO items (id, name) VALUES (?, ?)").run("two", "Second item");
    });

    await expect(db.prepare("SELECT id FROM items ORDER BY id").all<{ id: string }>()).resolves.toEqual([
      { id: "one" },
      { id: "two" },
    ]);

    await db.close();
  });

  it("rolls back SQLite adapter transactions when the callback fails", async () => {
    const db = openSqliteAdapter();

    await db.exec("CREATE TABLE items (id TEXT PRIMARY KEY, name TEXT NOT NULL)");
    await expect(
      db.transaction(async () => {
        await db.prepare("INSERT INTO items (id, name) VALUES (?, ?)").run("one", "First item");
        throw new Error("stop transaction");
      }),
    ).rejects.toThrow("stop transaction");

    await expect(db.prepare("SELECT id FROM items").all()).resolves.toEqual([]);
    await db.close();
  });
});
