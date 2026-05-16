import { openMigratedSqliteAdapter } from "@apiagex/database";
import { describe, expect, it } from "vitest";
import { createServer } from "../src/app.js";

describe("admin API authentication", () => {
  it("reports whether the first owner exists", async () => {
    const server = createServer({ database: openMigratedSqliteAdapter() });

    const before = await server.inject({ method: "GET", url: "/api/auth/owner-status" });
    await server.inject({
      method: "POST",
      url: "/api/auth/bootstrap-owner",
      payload: { email: "owner@apiagex.local", password: "OwnerPass123!" },
    });
    const after = await server.inject({ method: "GET", url: "/api/auth/owner-status" });

    expect(before.statusCode).toBe(200);
    expect(before.json()).toEqual({ hasOwner: false, ok: true });
    expect(after.statusCode).toBe(200);
    expect(after.json()).toEqual({ hasOwner: true, ok: true });
  });

  it("blocks admin APIs until an owner token is sent", async () => {
    const server = createServer({ database: openMigratedSqliteAdapter() });

    const response = await server.inject({
      method: "POST",
      url: "/api/admin/schemas",
      payload: {
        fields: [{ name: "Title", slug: "title", type: "text" }],
        name: "Article",
        slug: "article",
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ ok: false, error: "ADMIN_AUTH_REQUIRED" });
  });

  it("accepts a valid owner token for admin APIs and session validation", async () => {
    const server = createServer({ database: openMigratedSqliteAdapter() });
    const auth = await server.inject({
      method: "POST",
      url: "/api/auth/bootstrap-owner",
      payload: { email: "owner@apiagex.local", password: "OwnerPass123!" },
    });
    const token = auth.json().token as string;

    const session = await server.inject({
      method: "GET",
      url: "/api/auth/session",
      headers: { authorization: `Bearer ${token}` },
    });
    const create = await server.inject({
      method: "POST",
      url: "/api/admin/schemas",
      headers: { authorization: `Bearer ${token}` },
      payload: {
        fields: [{ name: "Title", slug: "title", type: "text" }],
        name: "Article",
        slug: "article",
      },
    });

    expect(session.statusCode).toBe(200);
    expect(session.json().user.email).toBe("owner@apiagex.local");
    expect(create.statusCode).toBe(200);
    expect(create.json().schema.slug).toBe("article");
  });

  it("rejects stale owner tokens after the backing owner row is gone", async () => {
    const database = openMigratedSqliteAdapter();
    const server = createServer({ database });
    const auth = await server.inject({
      method: "POST",
      url: "/api/auth/bootstrap-owner",
      payload: { email: "owner@apiagex.local", password: "OwnerPass123!" },
    });
    const token = auth.json().token as string;
    await database.prepare("DELETE FROM users").run();

    const response = await server.inject({
      method: "GET",
      url: "/api/admin/schemas",
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ ok: false, error: "ADMIN_AUTH_INVALID" });
  });
});
