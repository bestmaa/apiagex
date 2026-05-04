import { openSqliteDatabase } from "@apiagex/database";
import { describe, expect, it } from "vitest";
import { createServer } from "../src/app.js";

describe("user admin APIs", () => {
  it("creates, lists, and reads users with one role", async () => {
    const server = createServer({ database: openSqliteDatabase() });
    const role = await server.inject({
      method: "POST",
      url: "/api/admin/roles",
      payload: { name: "editor" },
    });

    const create = await server.inject({
      method: "POST",
      url: "/api/admin/users",
      payload: {
        email: "Editor@Apiagex.local",
        password: "UserPass123!",
        roleId: role.json().role.id,
      },
    });
    expect(create.statusCode).toBe(200);
    const user = create.json().user as { id: string };

    const list = await server.inject({ method: "GET", url: "/api/admin/users" });
    expect(list.json().users).toHaveLength(1);

    const read = await server.inject({ method: "GET", url: `/api/admin/users/${user.id}` });
    expect(read.json().user.roleName).toBe("editor");
  });

  it("rejects users without valid role", async () => {
    const server = createServer({ database: openSqliteDatabase() });

    const response = await server.inject({
      method: "POST",
      url: "/api/admin/users",
      payload: {
        email: "user@apiagex.local",
        password: "UserPass123!",
        roleId: "missing",
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ ok: false, error: "ROLE_NOT_FOUND" });
  });
});
