import { randomUUID } from "node:crypto";
import { openSqliteDatabase } from "@apiagex/database";
import { describe, expect, it } from "vitest";
import { createServer } from "../src/app.js";

describe("entry admin APIs", () => {
  it("creates, lists, reads, updates, and deletes entries per schema", async () => {
    const server = createServer({ database: openSqliteDatabase() });
    const schemaId = await createArticleSchema(server);

    const create = await server.inject({
      method: "POST",
      url: `/api/admin/schemas/${schemaId}/entries`,
      payload: { data: { title: "Hello", views: 1 } },
    });
    expect(create.statusCode).toBe(200);
    const entry = create.json().entry as { id: string };

    const list = await server.inject({
      method: "GET",
      url: `/api/admin/schemas/${schemaId}/entries`,
    });
    expect(list.json().entries).toHaveLength(1);

    const read = await server.inject({
      method: "GET",
      url: `/api/admin/schemas/${schemaId}/entries/${entry.id}`,
    });
    expect(read.json().entry.data.title).toBe("Hello");

    const update = await server.inject({
      method: "PUT",
      url: `/api/admin/schemas/${schemaId}/entries/${entry.id}`,
      payload: { data: { title: "Updated", views: 2 } },
    });
    expect(update.json().entry.data.views).toBe(2);

    const remove = await server.inject({
      method: "DELETE",
      url: `/api/admin/schemas/${schemaId}/entries/${entry.id}`,
    });
    expect(remove.json()).toEqual({ ok: true, deleted: true });
  });

  it("returns schema validation errors from entry create", async () => {
    const server = createServer({ database: openSqliteDatabase() });
    const schemaId = await createArticleSchema(server);

    const response = await server.inject({
      method: "POST",
      url: `/api/admin/schemas/${schemaId}/entries`,
      payload: { data: { title: 123 } },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      ok: false,
      error: "ENTRY_FIELD_TYPE_INVALID:title",
    });
  });
});

async function createArticleSchema(server: ReturnType<typeof createServer>): Promise<string> {
  const response = await server.inject({
    method: "POST",
    url: "/api/admin/schemas",
    payload: {
      name: "Article",
      slug: `article-${randomUUID()}`,
      fields: [
        { name: "Title", slug: "title", type: "text", required: true },
        { name: "Views", slug: "views", type: "number" },
      ],
    },
  });
  return response.json().schema.id as string;
}
