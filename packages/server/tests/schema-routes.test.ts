import { openSqliteDatabase } from "@apiagex/database";
import { describe, expect, it } from "vitest";
import { createServer } from "../src/app.js";

const articlePayload = {
  name: "Article",
  slug: "article",
  description: "Editorial content",
  fields: [
    { name: "Title", slug: "title", type: "text", required: true },
    { name: "Body", slug: "body", type: "longText" },
  ],
};

describe("schema admin APIs", () => {
  it("creates, lists, reads, updates, and deletes schemas", async () => {
    const server = createServer({ database: openSqliteDatabase() });

    const create = await server.inject({
      method: "POST",
      url: "/api/admin/schemas",
      payload: articlePayload,
    });
    expect(create.statusCode).toBe(200);
    const created = create.json().schema as { id: string; fields: unknown[] };
    expect(created.fields).toHaveLength(2);

    const list = await server.inject({ method: "GET", url: "/api/admin/schemas" });
    expect(list.json().schemas).toHaveLength(1);

    const read = await server.inject({
      method: "GET",
      url: `/api/admin/schemas/${created.id}`,
    });
    expect(read.json().schema.slug).toBe("article");

    const update = await server.inject({
      method: "PUT",
      url: `/api/admin/schemas/${created.id}`,
      payload: { ...articlePayload, name: "Post", slug: "post" },
    });
    expect(update.statusCode).toBe(200);
    expect(update.json().schema.slug).toBe("post");

    const remove = await server.inject({
      method: "DELETE",
      url: `/api/admin/schemas/${created.id}`,
    });
    expect(remove.statusCode).toBe(200);
    expect(remove.json()).toEqual({ ok: true, deleted: true });
  });

  it("rejects invalid schema fields", async () => {
    const server = createServer({ database: openSqliteDatabase() });

    const response = await server.inject({
      method: "POST",
      url: "/api/admin/schemas",
      payload: {
        name: "Bad",
        slug: "bad",
        fields: [{ name: "Bad Field", slug: "Bad Field", type: "text" }],
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ ok: false, error: "FIELD_SLUG_INVALID" });
  });
});
