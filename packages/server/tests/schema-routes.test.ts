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
    const server = createServer({ adminAuth: "disabled", database: openSqliteDatabase() });

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

  it("creates enum schema fields with allowed options", async () => {
    const server = createServer({ adminAuth: "disabled", database: openSqliteDatabase() });

    const response = await server.inject({
      method: "POST",
      url: "/api/admin/schemas",
      payload: {
        name: "Post",
        slug: "post",
        fields: [{ name: "Status", options: ["draft", "published"], slug: "status", type: "enum" }],
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().schema.fields[0]).toMatchObject({
      options: ["draft", "published"],
      slug: "status",
      type: "enum",
    });
  });

  it("rejects invalid schema fields", async () => {
    const server = createServer({ adminAuth: "disabled", database: openSqliteDatabase() });

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

  it("creates relation fields only when target schema exists", async () => {
    const server = createServer({ adminAuth: "disabled", database: openSqliteDatabase() });
    const author = await server.inject({
      method: "POST",
      url: "/api/admin/schemas",
      payload: {
        name: "Author",
        slug: "author",
        fields: [{ name: "Name", slug: "name", type: "text" }],
      },
    });
    const authorId = author.json().schema.id as string;

    const book = await server.inject({
      method: "POST",
      url: "/api/admin/schemas",
      payload: {
        name: "Book",
        slug: "book",
        fields: [
          {
            name: "Author",
            slug: "author",
            type: "relation",
            relationSchemaId: authorId,
            relationType: "manyToOne",
          },
        ],
      },
    });
    expect(book.statusCode).toBe(200);
    expect(book.json().schema.fields[0].relationSchemaId).toBe(authorId);
    expect(book.json().schema.fields[0].relationType).toBe("manyToOne");
    expect(book.json().schema.fields[0].relationTarget).toMatchObject({
      id: authorId,
      slug: "author",
    });

    const list = await server.inject({ method: "GET", url: "/api/admin/schemas" });
    const listedBook = list.json().schemas.find((schema: { slug: string }) => schema.slug === "book");
    expect(listedBook.fields[0].relationTarget).toMatchObject({ id: authorId, slug: "author" });

    const bad = await server.inject({
      method: "POST",
      url: "/api/admin/schemas",
      payload: {
        name: "Bad Book",
        slug: "bad-book",
        fields: [{ name: "Author", slug: "author", type: "relation" }],
      },
    });
    expect(bad.statusCode).toBe(400);
    expect(bad.json()).toEqual({ ok: false, error: "RELATION_TARGET_REQUIRED" });

    const invalidType = await server.inject({
      method: "POST",
      url: "/api/admin/schemas",
      payload: {
        name: "Invalid Book",
        slug: "invalid-book",
        fields: [
          {
            name: "Author",
            slug: "author",
            type: "relation",
            relationSchemaId: authorId,
            relationType: "wrong",
          },
        ],
      },
    });
    expect(invalidType.statusCode).toBe(400);
    expect(invalidType.json()).toEqual({ ok: false, error: "RELATION_TYPE_INVALID" });
  });

  it("blocks deleting relation target schemas", async () => {
    const server = createServer({ adminAuth: "disabled", database: openSqliteDatabase() });
    const author = await server.inject({
      method: "POST",
      url: "/api/admin/schemas",
      payload: {
        name: "Author",
        slug: "author",
        fields: [{ name: "Name", slug: "name", type: "text" }],
      },
    });
    const authorId = author.json().schema.id as string;
    const book = await server.inject({
      method: "POST",
      url: "/api/admin/schemas",
      payload: {
        name: "Book",
        slug: "book",
        fields: [
          {
            name: "Author",
            slug: "author",
            type: "relation",
            relationSchemaId: authorId,
            relationType: "manyToOne",
          },
        ],
      },
    });
    const bookId = book.json().schema.id as string;

    const blocked = await server.inject({
      method: "DELETE",
      url: `/api/admin/schemas/${authorId}`,
    });
    expect(blocked.statusCode).toBe(400);
    expect(blocked.json()).toEqual({
      ok: false,
      error: `RELATION_SCHEMA_REFERENCED:${authorId}`,
    });

    const deletedSource = await server.inject({
      method: "DELETE",
      url: `/api/admin/schemas/${bookId}`,
    });
    expect(deletedSource.statusCode).toBe(200);
  });
});
