import { describe, expect, it } from "vitest";
import {
  createEntry,
  createSchema,
  listEntries,
  migrateMvpDatabase,
  openSqliteDatabase,
  updateEntry,
} from "../src/index.js";

describe("entry repository", () => {
  it("creates, lists, and updates entries with schema fields", () => {
    const db = openMigratedDb();
    const schema = createSchema(db, {
      name: "Article",
      slug: "article",
      fields: [
        { name: "Title", slug: "title", type: "text", required: true },
        { name: "Views", slug: "views", type: "number" },
        { name: "Live", slug: "live", type: "boolean" },
      ],
    });

    const entry = createEntry(db, {
      schemaId: schema.id,
      data: { title: "Hello", views: 10, live: true },
    });
    const updated = updateEntry(db, entry.id, {
      data: { title: "Updated", views: 11, live: false },
    });

    expect(listEntries(db, schema.id)).toHaveLength(1);
    expect(updated.data).toMatchObject({ title: "Updated", views: 11 });
  });

  it("rejects required, unknown, and wrong typed fields", () => {
    const db = openMigratedDb();
    const schema = createSchema(db, {
      name: "Article",
      slug: "article",
      fields: [{ name: "Title", slug: "title", type: "text", required: true }],
    });

    expect(() => createEntry(db, { schemaId: schema.id, data: {} })).toThrow(
      "ENTRY_FIELD_REQUIRED:title",
    );
    expect(() =>
      createEntry(db, { schemaId: schema.id, data: { title: "Ok", extra: true } }),
    ).toThrow("ENTRY_FIELD_UNKNOWN");
    expect(() =>
      createEntry(db, { schemaId: schema.id, data: { title: 123 } }),
    ).toThrow("ENTRY_FIELD_TYPE_INVALID:title");
  });

  it("validates relation entry targets", () => {
    const db = openMigratedDb();
    const authorSchema = createSchema(db, {
      name: "Author",
      slug: "author",
      fields: [{ name: "Name", slug: "name", type: "text", required: true }],
    });
    const author = createEntry(db, {
      schemaId: authorSchema.id,
      data: { name: "Asha" },
    });
    const bookSchema = createSchema(db, {
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

    const book = createEntry(db, {
      schemaId: bookSchema.id,
      data: { author: author.id },
    });

    expect(book.data.author).toBe(author.id);
    expect(() =>
      createEntry(db, { schemaId: bookSchema.id, data: { author: "missing" } }),
    ).toThrow("RELATION_TARGET_ENTRY_INVALID:author");
    expect(() =>
      createEntry(db, { schemaId: bookSchema.id, data: { author: ["not-single"] } }),
    ).toThrow("RELATION_VALUE_SHAPE_INVALID:author");
  });

  it("keeps legacy relation metadata as many-to-one", () => {
    const db = openMigratedDb();
    const authorSchema = createSchema(db, {
      name: "Author",
      slug: "author",
      fields: [{ name: "Name", slug: "name", type: "text", required: true }],
    });
    const author = createEntry(db, {
      schemaId: authorSchema.id,
      data: { name: "Asha" },
    });
    const bookSchema = createSchema(db, {
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

    const book = createEntry(db, {
      schemaId: bookSchema.id,
      data: { author: author.id },
    });

    expect(book.data.author).toBe(author.id);
  });

  it("validates one-to-one entry values", () => {
    const db = openMigratedDb();
    const authorSchema = createSchema(db, {
      name: "Author",
      slug: "author",
      fields: [{ name: "Name", slug: "name", type: "text", required: true }],
    });
    const author = createEntry(db, {
      schemaId: authorSchema.id,
      data: { name: "Asha" },
    });
    const profileSchema = createSchema(db, {
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

    const profile = createEntry(db, {
      schemaId: profileSchema.id,
      data: { author: author.id },
    });

    expect(profile.data.author).toBe(author.id);
    expect(() =>
      createEntry(db, { schemaId: profileSchema.id, data: { author: author.id } }),
    ).toThrow("RELATION_ONE_TO_ONE_CONFLICT:author");
    expect(() =>
      createEntry(db, { schemaId: profileSchema.id, data: { author: ["not-single"] } }),
    ).toThrow("RELATION_VALUE_SHAPE_INVALID:author");
    expect(() =>
      updateEntry(db, profile.id, { data: { author: author.id } }),
    ).not.toThrow();
  });

  it("validates one-to-many entry values", () => {
    const db = openMigratedDb();
    const articleSchema = createSchema(db, {
      name: "Article",
      slug: "article",
      fields: [{ name: "Title", slug: "title", type: "text", required: true }],
    });
    const firstArticle = createEntry(db, {
      schemaId: articleSchema.id,
      data: { title: "One" },
    });
    const secondArticle = createEntry(db, {
      schemaId: articleSchema.id,
      data: { title: "Two" },
    });
    const authorSchema = createSchema(db, {
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

    const author = createEntry(db, {
      schemaId: authorSchema.id,
      data: { articles: [firstArticle.id, secondArticle.id] },
    });

    expect(author.data.articles).toEqual([firstArticle.id, secondArticle.id]);
    expect(() =>
      createEntry(db, { schemaId: authorSchema.id, data: { articles: firstArticle.id } }),
    ).toThrow("RELATION_VALUE_SHAPE_INVALID:articles");
    expect(() =>
      createEntry(db, { schemaId: authorSchema.id, data: { articles: [] } }),
    ).toThrow("ENTRY_FIELD_REQUIRED:articles");
    expect(() =>
      createEntry(db, { schemaId: authorSchema.id, data: { articles: ["missing"] } }),
    ).toThrow("RELATION_TARGET_ENTRY_INVALID:articles");
  });

  it("validates many-to-many entry values", () => {
    const db = openMigratedDb();
    const tagSchema = createSchema(db, {
      name: "Tag",
      slug: "tag",
      fields: [{ name: "Name", slug: "name", type: "text", required: true }],
    });
    const firstTag = createEntry(db, { schemaId: tagSchema.id, data: { name: "CMS" } });
    const secondTag = createEntry(db, { schemaId: tagSchema.id, data: { name: "API" } });
    const articleSchema = createSchema(db, {
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

    const article = createEntry(db, {
      schemaId: articleSchema.id,
      data: { tags: [firstTag.id, secondTag.id], title: "Tagged" },
    });

    expect(article.data.tags).toEqual([firstTag.id, secondTag.id]);
    expect(() =>
      createEntry(db, { schemaId: articleSchema.id, data: { tags: firstTag.id, title: "Bad" } }),
    ).toThrow("RELATION_VALUE_SHAPE_INVALID:tags");
    expect(() =>
      createEntry(db, {
        schemaId: articleSchema.id,
        data: { tags: [firstTag.id, firstTag.id], title: "Duplicate" },
      }),
    ).toThrow("RELATION_VALUE_SHAPE_INVALID:tags");
    expect(() =>
      createEntry(db, {
        schemaId: articleSchema.id,
        data: { tags: ["missing"], title: "Missing" },
      }),
    ).toThrow("RELATION_TARGET_ENTRY_INVALID:tags");
  });
});

function openMigratedDb() {
  const db = openSqliteDatabase();
  migrateMvpDatabase(db);
  return db;
}
