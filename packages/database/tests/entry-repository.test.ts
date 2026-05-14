import { describe, expect, it } from "vitest";
import {
  createEntry,
  deleteEntry,
  createSchema,
  listEntries,
  openMigratedSqliteAdapter,
  updateEntry,
} from "../src/index.js";

describe("entry repository", () => {
  it("creates, lists, and updates entries with schema fields", async () => {
    const db = openMigratedDb();
    const schema = await createSchema(db, {
      name: "Article",
      slug: "article",
      fields: [
        { name: "Title", slug: "title", type: "text", required: true },
        { name: "Views", slug: "views", type: "number" },
        { name: "Live", slug: "live", type: "boolean" },
      ],
    });

    const entry = await createEntry(db, {
      schemaId: schema.id,
      data: { title: "Hello", views: 10, live: true },
    });
    const updated = await updateEntry(db, entry.id, {
      data: { title: "Updated", views: 11, live: false },
    });

    expect(await listEntries(db, schema.id)).toHaveLength(1);
    expect(updated.data).toMatchObject({ title: "Updated", views: 11 });
  });

  it("rejects required, unknown, and wrong typed fields", async () => {
    const db = openMigratedDb();
    const schema = await createSchema(db, {
      name: "Article",
      slug: "article",
      fields: [{ name: "Title", slug: "title", type: "text", required: true }],
    });

    await expect(createEntry(db, { schemaId: schema.id, data: {} })).rejects.toThrow(
      "ENTRY_FIELD_REQUIRED:title",
    );
    await expect(
      createEntry(db, { schemaId: schema.id, data: { title: "Ok", extra: true } }),
    ).rejects.toThrow("ENTRY_FIELD_UNKNOWN");
    await expect(
      createEntry(db, { schemaId: schema.id, data: { title: 123 } }),
    ).rejects.toThrow("ENTRY_FIELD_TYPE_INVALID:title");
  });

  it("validates relation entry targets", async () => {
    const db = openMigratedDb();
    const authorSchema = await createSchema(db, {
      name: "Author",
      slug: "author",
      fields: [{ name: "Name", slug: "name", type: "text", required: true }],
    });
    const author = await createEntry(db, {
      schemaId: authorSchema.id,
      data: { name: "Asha" },
    });
    const bookSchema = await createSchema(db, {
      name: "Book",
      slug: "book",
      fields: [
        {
          name: "Author",
          slug: "author",
          type: "relation",
          relationSchemaId: authorSchema.id,
          relationType: "manyToOne",
        },
      ],
    });

    const book = await createEntry(db, {
      schemaId: bookSchema.id,
      data: { author: author.id },
    });

    expect(book.data.author).toBe(author.id);
    await expect(
      createEntry(db, { schemaId: bookSchema.id, data: { author: "missing" } }),
    ).rejects.toThrow("RELATION_TARGET_ENTRY_INVALID:author");
    await expect(
      createEntry(db, { schemaId: bookSchema.id, data: { author: ["not-single"] } }),
    ).rejects.toThrow("RELATION_VALUE_SHAPE_INVALID:author");
  });

  it("keeps legacy relation metadata as many-to-one", async () => {
    const db = openMigratedDb();
    const authorSchema = await createSchema(db, {
      name: "Author",
      slug: "author",
      fields: [{ name: "Name", slug: "name", type: "text", required: true }],
    });
    const author = await createEntry(db, {
      schemaId: authorSchema.id,
      data: { name: "Asha" },
    });
    const bookSchema = await createSchema(db, {
      name: "Book",
      slug: "book",
      fields: [
        {
          name: "Author",
          slug: "author",
          type: "relation",
          relationSchemaId: authorSchema.id,
        },
      ],
    });

    const book = await createEntry(db, {
      schemaId: bookSchema.id,
      data: { author: author.id },
    });

    expect(book.data.author).toBe(author.id);
  });

  it("validates one-to-one entry values", async () => {
    const db = openMigratedDb();
    const authorSchema = await createSchema(db, {
      name: "Author",
      slug: "author",
      fields: [{ name: "Name", slug: "name", type: "text", required: true }],
    });
    const author = await createEntry(db, {
      schemaId: authorSchema.id,
      data: { name: "Asha" },
    });
    const profileSchema = await createSchema(db, {
      name: "Profile",
      slug: "profile",
      fields: [
        {
          name: "Author",
          slug: "author",
          type: "relation",
          relationSchemaId: authorSchema.id,
          relationType: "oneToOne",
          required: true,
        },
      ],
    });

    const profile = await createEntry(db, {
      schemaId: profileSchema.id,
      data: { author: author.id },
    });

    expect(profile.data.author).toBe(author.id);
    await expect(
      createEntry(db, { schemaId: profileSchema.id, data: { author: author.id } }),
    ).rejects.toThrow("RELATION_ONE_TO_ONE_CONFLICT:author");
    await expect(
      createEntry(db, { schemaId: profileSchema.id, data: { author: ["not-single"] } }),
    ).rejects.toThrow("RELATION_VALUE_SHAPE_INVALID:author");
    await expect(
      updateEntry(db, profile.id, { data: { author: author.id } }),
    ).resolves.toBeDefined();
  });

  it("validates one-to-many entry values", async () => {
    const db = openMigratedDb();
    const articleSchema = await createSchema(db, {
      name: "Article",
      slug: "article",
      fields: [{ name: "Title", slug: "title", type: "text", required: true }],
    });
    const firstArticle = await createEntry(db, {
      schemaId: articleSchema.id,
      data: { title: "One" },
    });
    const secondArticle = await createEntry(db, {
      schemaId: articleSchema.id,
      data: { title: "Two" },
    });
    const authorSchema = await createSchema(db, {
      name: "Author",
      slug: "author",
      fields: [
        {
          name: "Articles",
          slug: "articles",
          type: "relation",
          relationSchemaId: articleSchema.id,
          relationType: "oneToMany",
          required: true,
        },
      ],
    });

    const author = await createEntry(db, {
      schemaId: authorSchema.id,
      data: { articles: [firstArticle.id, secondArticle.id, firstArticle.id] },
    });

    expect(author.data.articles).toEqual([firstArticle.id, secondArticle.id]);
    await expect(
      createEntry(db, { schemaId: authorSchema.id, data: { articles: firstArticle.id } }),
    ).rejects.toThrow("RELATION_VALUE_SHAPE_INVALID:articles");
    await expect(
      createEntry(db, { schemaId: authorSchema.id, data: { articles: [] } }),
    ).rejects.toThrow("ENTRY_FIELD_REQUIRED:articles");
    await expect(
      createEntry(db, { schemaId: authorSchema.id, data: { articles: ["missing"] } }),
    ).rejects.toThrow("RELATION_TARGET_ENTRY_INVALID:articles");
  });

  it("validates many-to-many entry values", async () => {
    const db = openMigratedDb();
    const tagSchema = await createSchema(db, {
      name: "Tag",
      slug: "tag",
      fields: [{ name: "Name", slug: "name", type: "text", required: true }],
    });
    const firstTag = await createEntry(db, { schemaId: tagSchema.id, data: { name: "CMS" } });
    const secondTag = await createEntry(db, { schemaId: tagSchema.id, data: { name: "API" } });
    const articleSchema = await createSchema(db, {
      name: "Article",
      slug: "article",
      fields: [
        { name: "Title", slug: "title", type: "text", required: true },
        {
          name: "Tags",
          slug: "tags",
          type: "relation",
          relationSchemaId: tagSchema.id,
          relationType: "manyToMany",
        },
      ],
    });

    const article = await createEntry(db, {
      schemaId: articleSchema.id,
      data: { tags: [firstTag.id, secondTag.id], title: "Tagged" },
    });

    expect(article.data.tags).toEqual([firstTag.id, secondTag.id]);
    await expect(
      createEntry(db, { schemaId: articleSchema.id, data: { tags: firstTag.id, title: "Bad" } }),
    ).rejects.toThrow("RELATION_VALUE_SHAPE_INVALID:tags");
    const duplicateTags = await createEntry(db, {
      schemaId: articleSchema.id,
      data: { tags: [firstTag.id, firstTag.id], title: "Duplicate" },
    });
    expect(duplicateTags.data.tags).toEqual([firstTag.id]);
    await expect(
      createEntry(db, {
        schemaId: articleSchema.id,
        data: { tags: ["missing"], title: "Missing" },
      }),
    ).rejects.toThrow("RELATION_TARGET_ENTRY_INVALID:tags");
  });

  it("blocks deleting referenced target entries", async () => {
    const db = openMigratedDb();
    const authorSchema = await createSchema(db, {
      name: "Author",
      slug: "author",
      fields: [{ name: "Name", slug: "name", type: "text", required: true }],
    });
    const author = await createEntry(db, {
      schemaId: authorSchema.id,
      data: { name: "Asha" },
    });
    const bookSchema = await createSchema(db, {
      name: "Book",
      slug: "book",
      fields: [
        {
          name: "Author",
          slug: "author",
          type: "relation",
          relationSchemaId: authorSchema.id,
          relationType: "manyToOne",
        },
      ],
    });
    const book = await createEntry(db, {
      schemaId: bookSchema.id,
      data: { author: author.id },
    });

    await expect(deleteEntry(db, author.id)).rejects.toThrow(`RELATION_ENTRY_REFERENCED:${author.id}`);
    await expect(deleteEntry(db, book.id)).resolves.toBeUndefined();
  });
});

function openMigratedDb() {
  return openMigratedSqliteAdapter();
}
