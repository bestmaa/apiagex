import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openSqliteDatabase } from "@apiagex/database";
import { afterEach, describe, expect, it } from "vitest";
import { createServer } from "../src/app.js";

const tempDirs: string[] = [];

describe("entry admin APIs", () => {
  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { force: true, recursive: true })));
  });

  it("creates, lists, reads, updates, and deletes entries per schema", async () => {
    const server = createServer({ adminAuth: "disabled", database: openSqliteDatabase() });
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
    const server = createServer({ adminAuth: "disabled", database: openSqliteDatabase() });
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

  it("uploads media through the schema entry API and saves the scoped URL", async () => {
    const uploadsPath = await tempUploadsPath();
    const server = createServer({ adminAuth: "disabled", database: openSqliteDatabase(), uploadsPath });
    const schema = await createMediaSchema(server);

    const create = await server.inject({
      method: "POST",
      payload: {
        data: { title: "Launch" },
        mediaUploads: {
          hero: {
            contentBase64: Buffer.from("hero image").toString("base64"),
            contentType: "image/png",
            filename: "../Hero Image.png",
          },
        },
      },
      url: `/api/admin/schemas/${schema.id}/entries`,
    });

    expect(create.statusCode).toBe(200);
    const url = create.json().entry.data.hero as string;
    expect(url).toMatch(new RegExp(`^/uploads/${schema.slug}/hero/.+-Hero-Image\\.png$`));

    const served = await server.inject({ method: "GET", url });
    expect(served.statusCode).toBe(200);
    expect(served.body).toBe("hero image");
  });

  it("supports file and image fields through schema-scoped uploads", async () => {
    const uploadsPath = await tempUploadsPath();
    const server = createServer({ adminAuth: "disabled", database: openSqliteDatabase(), uploadsPath });
    const schemaResponse = await server.inject({
      method: "POST",
      payload: {
        fields: [
          { name: "Hero", required: true, slug: "hero", type: "image" },
          { name: "Attachment", slug: "attachment", type: "file" },
        ],
        name: "Gallery",
        slug: "gallery",
      },
      url: "/api/admin/schemas",
    });
    const schemaId = schemaResponse.json().schema.id as string;

    const create = await server.inject({
      method: "POST",
      payload: {
        data: {},
        mediaUploads: {
          attachment: {
            contentBase64: Buffer.from("pdf").toString("base64"),
            contentType: "application/pdf",
            filename: "guide.pdf",
          },
          hero: {
            contentBase64: Buffer.from("png").toString("base64"),
            contentType: "image/png",
            filename: "hero.png",
          },
        },
      },
      url: `/api/admin/schemas/${schemaId}/entries`,
    });

    expect(create.statusCode).toBe(200);
    expect(create.json().entry.data.hero).toContain("/uploads/gallery/hero/");
    expect(create.json().entry.data.attachment).toContain("/uploads/gallery/attachment/");

    const rejected = await server.inject({
      method: "POST",
      payload: {
        data: {},
        mediaUploads: {
          hero: {
            contentBase64: Buffer.from("pdf").toString("base64"),
            contentType: "application/pdf",
            filename: "hero.pdf",
          },
        },
      },
      url: `/api/admin/schemas/${schemaId}/entries`,
    });
    expect(rejected.statusCode).toBe(400);
    expect(rejected.json()).toEqual({ ok: false, error: "MEDIA_CONTENT_TYPE_NOT_ALLOWED" });
  });

  it("lists entries with search, field projection, and pagination metadata", async () => {
    const server = createServer({ adminAuth: "disabled", database: openSqliteDatabase() });
    const schemaId = await createArticleSchema(server);
    for (const [title, views] of [
      ["Alpha", 1],
      ["Beta", 2],
      ["Alpha draft", 3],
    ] as const) {
      await server.inject({
        method: "POST",
        url: `/api/admin/schemas/${schemaId}/entries`,
        payload: { data: { title, views } },
      });
    }

    const response = await server.inject({
      method: "GET",
      url: `/api/admin/schemas/${schemaId}/entries?search=Alpha&fields=title&limit=1&offset=1`,
    });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.total).toBe(2);
    expect(body.limit).toBe(1);
    expect(body.offset).toBe(1);
    expect(body.entries).toHaveLength(1);
    expect(Object.keys(body.entries[0].data)).toEqual(["title"]);
  });

  it("rejects unknown projected entry fields", async () => {
    const server = createServer({ adminAuth: "disabled", database: openSqliteDatabase() });
    const schemaId = await createArticleSchema(server);

    const response = await server.inject({
      method: "GET",
      url: `/api/admin/schemas/${schemaId}/entries?fields=missing`,
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ ok: false, error: "ENTRY_FIELD_UNKNOWN" });
  });

  it("returns relation validation errors from entry create and update", async () => {
    const server = createServer({ adminAuth: "disabled", database: openSqliteDatabase() });
    const authorSchemaId = await createAuthorSchema(server);
    const bookSchemaId = await createBookSchema(server, authorSchemaId);
    const author = await server.inject({
      method: "POST",
      url: `/api/admin/schemas/${authorSchemaId}/entries`,
      payload: { data: { name: "Octavia Butler" } },
    });
    const authorId = author.json().entry.id as string;
    const book = await server.inject({
      method: "POST",
      url: `/api/admin/schemas/${bookSchemaId}/entries`,
      payload: { data: { title: "Kindred", author: authorId } },
    });
    const bookId = book.json().entry.id as string;

    const invalidShape = await server.inject({
      method: "POST",
      url: `/api/admin/schemas/${bookSchemaId}/entries`,
      payload: { data: { title: "Bad shape", author: [authorId] } },
    });

    expect(invalidShape.statusCode).toBe(400);
    expect(invalidShape.json()).toEqual({
      ok: false,
      error: "RELATION_VALUE_SHAPE_INVALID:author",
    });

    const invalidTarget = await server.inject({
      method: "PUT",
      url: `/api/admin/schemas/${bookSchemaId}/entries/${bookId}`,
      payload: { data: { title: "Bad target", author: randomUUID() } },
    });

    expect(invalidTarget.statusCode).toBe(400);
    expect(invalidTarget.json()).toEqual({
      ok: false,
      error: "RELATION_TARGET_ENTRY_INVALID:author",
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

async function createMediaSchema(server: ReturnType<typeof createServer>): Promise<{ id: string; slug: string }> {
  const slug = `article-${randomUUID()}`;
  const response = await server.inject({
    method: "POST",
    payload: {
      fields: [
        { name: "Title", required: true, slug: "title", type: "text" },
        { name: "Hero", required: true, slug: "hero", type: "media" },
      ],
      name: "Article",
      slug,
    },
    url: "/api/admin/schemas",
  });
  return { id: response.json().schema.id as string, slug };
}

async function tempUploadsPath(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "apiagex-entry-media-"));
  tempDirs.push(dir);
  return dir;
}

async function createAuthorSchema(server: ReturnType<typeof createServer>): Promise<string> {
  const response = await server.inject({
    method: "POST",
    url: "/api/admin/schemas",
    payload: {
      name: "Author",
      slug: `author-${randomUUID()}`,
      fields: [{ name: "Name", slug: "name", type: "text", required: true }],
    },
  });
  return response.json().schema.id as string;
}

async function createBookSchema(
  server: ReturnType<typeof createServer>,
  authorSchemaId: string,
): Promise<string> {
  const response = await server.inject({
    method: "POST",
    url: "/api/admin/schemas",
    payload: {
      name: "Book",
      slug: `book-${randomUUID()}`,
      fields: [
        { name: "Title", slug: "title", type: "text", required: true },
        {
          name: "Author",
          slug: "author",
          type: "relation",
          relationSchemaId: authorSchemaId,
          relationType: "manyToOne",
          required: true,
        },
      ],
    },
  });
  return response.json().schema.id as string;
}
