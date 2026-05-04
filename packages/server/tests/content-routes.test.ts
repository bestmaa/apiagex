import { openSqliteDatabase } from "@apiagex/database";
import { describe, expect, it } from "vitest";
import { createServer } from "../src/app.js";

describe("dynamic content APIs", () => {
  it("creates, lists, reads, updates, and deletes content by schema slug", async () => {
    const server = createServer({ database: openSqliteDatabase() });
    await createArticleSchema(server);

    const create = await server.inject({
      method: "POST",
      url: "/api/content/article",
      payload: { data: { title: "Hello" } },
    });
    expect(create.statusCode).toBe(200);
    const entry = create.json().entry as { id: string };

    const list = await server.inject({ method: "GET", url: "/api/content/article" });
    expect(list.json().entries).toHaveLength(1);

    const read = await server.inject({ method: "GET", url: `/api/content/article/${entry.id}` });
    expect(read.json().entry.data.title).toBe("Hello");

    const update = await server.inject({
      method: "PUT",
      url: `/api/content/article/${entry.id}`,
      payload: { data: { title: "Updated" } },
    });
    expect(update.json().entry.data.title).toBe("Updated");

    const remove = await server.inject({
      method: "DELETE",
      url: `/api/content/article/${entry.id}`,
    });
    expect(remove.json()).toEqual({ ok: true, deleted: true });
  });

  it("returns schema and validation errors", async () => {
    const server = createServer({ database: openSqliteDatabase() });
    await createArticleSchema(server);

    const missingSchema = await server.inject({ method: "GET", url: "/api/content/missing" });
    expect(missingSchema.statusCode).toBe(404);
    expect(missingSchema.json()).toEqual({ ok: false, error: "SCHEMA_NOT_FOUND" });

    const invalid = await server.inject({
      method: "POST",
      url: "/api/content/article",
      payload: { data: {} },
    });
    expect(invalid.statusCode).toBe(400);
    expect(invalid.json()).toEqual({ ok: false, error: "ENTRY_FIELD_REQUIRED:title" });
  });
});

async function createArticleSchema(server: ReturnType<typeof createServer>): Promise<void> {
  await server.inject({
    method: "POST",
    url: "/api/admin/schemas",
    payload: {
      name: "Article",
      slug: "article",
      fields: [{ name: "Title", slug: "title", type: "text", required: true }],
    },
  });
}
