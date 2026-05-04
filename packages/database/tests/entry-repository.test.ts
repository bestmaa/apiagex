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
    ).toThrow("ENTRY_RELATION_TARGET_INVALID:author");
  });
});

function openMigratedDb() {
  const db = openSqliteDatabase();
  migrateMvpDatabase(db);
  return db;
}
