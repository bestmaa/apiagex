import { openSqliteDatabase } from "@apiagex/database";
import { describe, expect, it } from "vitest";
import { createServer } from "../src/app.js";

describe("role admin APIs", () => {
  it("creates, lists, and reads roles", async () => {
    const server = createServer({ database: openSqliteDatabase() });

    const create = await server.inject({
      method: "POST",
      url: "/api/admin/roles",
      payload: { name: "editor", description: "Can edit content" },
    });
    expect(create.statusCode).toBe(200);
    const role = create.json().role as { id: string };

    const list = await server.inject({ method: "GET", url: "/api/admin/roles" });
    expect(list.json().roles).toHaveLength(1);

    const read = await server.inject({ method: "GET", url: `/api/admin/roles/${role.id}` });
    expect(read.json().role.name).toBe("editor");
  });

  it("rejects invalid role names", async () => {
    const server = createServer({ database: openSqliteDatabase() });

    const response = await server.inject({
      method: "POST",
      url: "/api/admin/roles",
      payload: { name: "Bad Role" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ ok: false, error: "ROLE_NAME_INVALID" });
  });

  it("saves role permissions for schema actions", async () => {
    const server = createServer({ database: openSqliteDatabase() });
    const role = await server.inject({
      method: "POST",
      url: "/api/admin/roles",
      payload: { name: "editor" },
    });
    const schema = await server.inject({
      method: "POST",
      url: "/api/admin/schemas",
      payload: {
        name: "Article",
        slug: "article",
        fields: [{ name: "Title", slug: "title", type: "text" }],
      },
    });

    const save = await server.inject({
      method: "PUT",
      url: `/api/admin/roles/${role.json().role.id}/permissions`,
      payload: {
        permissions: [
          { schemaId: schema.json().schema.id, action: "getAll", allowed: true },
          { schemaId: schema.json().schema.id, action: "get", allowed: true },
        ],
      },
    });

    expect(save.statusCode).toBe(200);
    expect(save.json().permissions).toHaveLength(2);
  });
});
