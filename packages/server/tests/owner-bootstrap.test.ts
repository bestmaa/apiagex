import { openSqliteDatabase } from "@apiagex/database";
import { describe, expect, it } from "vitest";
import { createServer } from "../src/app.js";

describe("owner bootstrap API", () => {
  it("creates the first owner user and role", async () => {
    const database = openSqliteDatabase();
    const server = createServer({ database });

    const response = await server.inject({
      method: "POST",
      url: "/api/auth/bootstrap-owner",
      payload: {
        email: "Owner@Apiagex.local",
        password: "OwnerPass123!",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      ok: true,
      created: true,
      user: {
        email: "owner@apiagex.local",
        role: "owner",
      },
    });
    expect(database.prepare("SELECT name FROM roles").get()).toEqual({
      name: "owner",
    });
  });

  it("blocks a second owner bootstrap", async () => {
    const database = openSqliteDatabase();
    const server = createServer({ database });

    await server.inject({
      method: "POST",
      url: "/api/auth/bootstrap-owner",
      payload: {
        email: "owner@apiagex.local",
        password: "OwnerPass123!",
      },
    });
    const response = await server.inject({
      method: "POST",
      url: "/api/auth/bootstrap-owner",
      payload: {
        email: "second@apiagex.local",
        password: "OwnerPass123!",
      },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({
      ok: false,
      error: "OWNER_ALREADY_BOOTSTRAPPED",
    });
  });

  it("allows owner bootstrap when only non-owner users already exist", async () => {
    const database = openSqliteDatabase();
    const server = createServer({ database });
    const now = new Date().toISOString();
    database
      .prepare(
        "INSERT INTO roles (id, name, description, is_owner, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .run("role_editor", "editor", "Editor", 0, now, now);
    database
      .prepare(
        "INSERT INTO users (id, email, password_hash, role_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .run("user_editor", "editor@apiagex.local", "hash", "role_editor", now, now);

    const response = await server.inject({
      method: "POST",
      url: "/api/auth/bootstrap-owner",
      payload: {
        email: "owner@apiagex.local",
        password: "OwnerPass123!",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      ok: true,
      user: {
        email: "owner@apiagex.local",
        role: "owner",
      },
    });
  });

  it("logs in an existing owner", async () => {
    const database = openSqliteDatabase();
    const server = createServer({ database });

    await server.inject({
      method: "POST",
      url: "/api/auth/bootstrap-owner",
      payload: {
        email: "owner@apiagex.local",
        password: "OwnerPass123!",
      },
    });
    const response = await server.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: {
        email: "owner@apiagex.local",
        password: "OwnerPass123!",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      ok: true,
      user: {
        email: "owner@apiagex.local",
        role: "owner",
      },
    });
  });

  it("serves owner login controls in Admin UI", async () => {
    const server = createServer();
    const response = await server.inject({ method: "GET", url: "/adminui" });

    expect(response.statusCode).toBe(200);
    for (const text of ["Apiagex Admin UI", "id=\"root\"", "script"]) {
      expect(response.body).toContain(text);
    }
  });
});
