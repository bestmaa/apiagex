import { describe, expect, it } from "vitest";
import {
  createEntry,
  createSchema,
  deleteSchema,
  listSchemas,
  openMigratedSqliteAdapter,
  updateSchema,
} from "../src/index.js";

describe("schema repository", () => {
  it("creates schemas with ordered fields", async () => {
    const db = openMigratedSqliteAdapter();
    const schema = await createSchema(db, {
      name: "Post",
      slug: "post",
      fields: [
        { name: "Title", slug: "title", type: "text", required: true },
        { name: "Body", slug: "body", type: "longText" },
      ],
    });

    expect(schema.slug).toBe("post");
    expect(schema.fields.map((field) => field.slug)).toEqual(["title", "body"]);
    expect(await listSchemas(db)).toHaveLength(1);
  });

  it("allows relation fields to existing schemas", async () => {
    const db = openMigratedSqliteAdapter();
    const author = await createSchema(db, {
      name: "Author",
      slug: "author",
      fields: [{ name: "Name", slug: "name", type: "text" }],
    });

    const book = await createSchema(db, {
      name: "Book",
      slug: "book",
      fields: [{
        name: "Author",
        slug: "author",
        type: "relation",
        relationSchemaId: author.id,
        relationType: "manyToOne",
      }],
    });

    expect(book.fields[0]?.relationSchemaId).toBe(author.id);
    expect(book.fields[0]?.relationType).toBe("manyToOne");
  });

  it("blocks relation fields without an existing target", async () => {
    const db = openMigratedSqliteAdapter();

    await expect(createSchema(db, {
      name: "Book",
      slug: "book",
      fields: [{
        name: "Author",
        slug: "author",
        type: "relation",
        relationSchemaId: "missing",
      }],
    })).rejects.toThrow("RELATION_TARGET_MISSING");
  });

  it("blocks invalid relation type metadata", async () => {
    const db = openMigratedSqliteAdapter();
    const author = await createSchema(db, {
      name: "Author",
      slug: "author",
      fields: [{ name: "Name", slug: "name", type: "text" }],
    });

    await expect(createSchema(db, {
      name: "Book",
      slug: "book",
      fields: [{
        name: "Author",
        slug: "author",
        type: "relation",
        relationSchemaId: author.id,
        relationType: "wrong",
      }],
    })).rejects.toThrow("RELATION_TYPE_INVALID");
  });

  it("blocks relation metadata on non-relation fields", async () => {
    const db = openMigratedSqliteAdapter();
    const author = await createSchema(db, {
      name: "Author",
      slug: "author",
      fields: [{ name: "Name", slug: "name", type: "text" }],
    });

    await expect(createSchema(db, {
      name: "Book",
      slug: "book",
      fields: [{
        name: "Title",
        slug: "title",
        type: "text",
        relationSchemaId: author.id,
      }],
    })).rejects.toThrow("RELATION_METADATA_FOR_NON_RELATION_FIELD");
  });

  it("blocks deleting relation target schemas", async () => {
    const db = openMigratedSqliteAdapter();
    const author = await createSchema(db, {
      name: "Author",
      slug: "author",
      fields: [{ name: "Name", slug: "name", type: "text" }],
    });
    const book = await createSchema(db, {
      name: "Book",
      slug: "book",
      fields: [{
        name: "Author",
        slug: "author",
        type: "relation",
        relationSchemaId: author.id,
        relationType: "manyToOne",
      }],
    });

    await expect(deleteSchema(db, author.id)).rejects.toThrow(`RELATION_SCHEMA_REFERENCED:${author.id}`);
    await expect(deleteSchema(db, book.id)).resolves.toBeUndefined();
  });

  it("blocks unsafe relation field updates when entries use the field", async () => {
    const db = openMigratedSqliteAdapter();
    const author = await createSchema(db, {
      name: "Author",
      slug: "author",
      fields: [{ name: "Name", slug: "name", type: "text" }],
    });
    const category = await createSchema(db, {
      name: "Category",
      slug: "category",
      fields: [{ name: "Name", slug: "name", type: "text" }],
    });
    const authorEntry = await createEntry(db, { schemaId: author.id, data: { name: "Asha" } });
    const book = await createSchema(db, {
      name: "Book",
      slug: "book",
      fields: [{
        name: "Author",
        slug: "author",
        type: "relation",
        relationSchemaId: author.id,
        relationType: "manyToOne",
      }],
    });
    await createEntry(db, { schemaId: book.id, data: { author: authorEntry.id } });

    await expect(updateSchema(db, book.id, {
      name: "Book",
      slug: "book",
      fields: [{
        name: "Author",
        slug: "author",
        type: "relation",
        relationSchemaId: category.id,
        relationType: "manyToOne",
      }],
    })).rejects.toThrow("RELATION_FIELD_UPDATE_UNSAFE:author");
  });
});
