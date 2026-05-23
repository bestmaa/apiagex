import { describe, expect, it } from "vitest";
import {
  openPlatformDatabase,
  sqlitePathFromUrl,
} from "../src/index.js";

describe("platform database adapter", () => {
  it("opens a separate SQLite platform database without tenant migrations", async () => {
    const db = await openPlatformDatabase({ provider: "sqlite", url: ":memory:" });
    try {
      expect(db.provider).toBe("sqlite");
      await db.exec("CREATE TABLE platform_probe (id TEXT PRIMARY KEY)");
      await db.prepare("INSERT INTO platform_probe (id) VALUES (?)").run("ok");

      await expect(db.prepare("SELECT id FROM platform_probe").get<{ id: string }>()).resolves.toEqual({
        id: "ok",
      });
      await expect(db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'roles'").get())
        .resolves.toBeUndefined();
    } finally {
      await db.close();
    }
  });

  it("normalizes SQLite file URLs", () => {
    expect(sqlitePathFromUrl(":memory:")).toBe(":memory:");
    expect(sqlitePathFromUrl("file:./data/platform.sqlite")).toBe("./data/platform.sqlite");
    expect(sqlitePathFromUrl("file:///tmp/platform.sqlite")).toBe("/tmp/platform.sqlite");
  });

  it("requires a platform database URL", async () => {
    await expect(openPlatformDatabase({ provider: "sqlite", url: " " })).rejects.toThrow(
      "PLATFORM_DATABASE_URL_REQUIRED: sqlite",
    );
  });
});
