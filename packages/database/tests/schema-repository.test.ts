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

  it("validates enum field options and entry values", async () => {
    const db = openMigratedSqliteAdapter();
    const schema = await createSchema(db, {
      name: "Post",
      slug: "post",
      fields: [
        { name: "Status", options: ["draft", "published"], slug: "status", type: "enum", required: true },
      ],
    });

    expect(schema.fields[0]?.options).toEqual(["draft", "published"]);
    await expect(createEntry(db, { schemaId: schema.id, data: { status: "draft" } })).resolves.toMatchObject({
      data: { status: "draft" },
    });
    await expect(createEntry(db, { schemaId: schema.id, data: { status: "archived" } }))
      .rejects.toThrow("ENTRY_FIELD_TYPE_INVALID:status");
  });

  it("validates primitive field type values", async () => {
    const db = openMigratedSqliteAdapter();
    const schema = await createSchema(db, {
      name: "Profile",
      slug: "profile",
      fields: [
        { name: "Email", slug: "email", type: "email", required: true },
        { name: "Website", slug: "website", type: "url" },
        { name: "Age", slug: "age", type: "integer" },
        { name: "Price", slug: "price", type: "decimal" },
        { name: "Amount", slug: "amount", type: "currency" },
        { name: "Starts", slug: "starts", type: "datetime" },
        { name: "Opens", slug: "opens", type: "time" },
        { name: "Secret", slug: "secret", type: "password" },
        { name: "Body", slug: "body", type: "richText" },
      ],
    });

    await expect(createEntry(db, {
      schemaId: schema.id,
      data: {
        amount: 120.5,
        age: 3,
        body: "<p>Hello</p>",
        email: "user@example.com",
        opens: "09:30",
        price: 19.99,
        secret: "hidden",
        starts: "2026-05-23T10:30",
        website: "https://example.com",
      },
    })).resolves.toMatchObject({ data: { email: "user@example.com", age: 3 } });
    await expect(createEntry(db, { schemaId: schema.id, data: { email: "bad", age: 1.5 } }))
      .rejects.toThrow("ENTRY_FIELD_TYPE_INVALID:email");
    await expect(createEntry(db, { schemaId: schema.id, data: { email: "user@example.com", age: 1.5 } }))
      .rejects.toThrow("ENTRY_FIELD_TYPE_INVALID:age");
  });

  it("validates multiSelect options and entry values", async () => {
    const db = openMigratedSqliteAdapter();
    const schema = await createSchema(db, {
      name: "Product",
      slug: "product",
      fields: [
        { name: "Tags", options: ["new", "sale", "featured"], slug: "tags", type: "multiSelect", required: true },
      ],
    });

    await expect(createEntry(db, { schemaId: schema.id, data: { tags: ["new", "sale", "new"] } }))
      .resolves.toMatchObject({ data: { tags: ["new", "sale"] } });
    await expect(createEntry(db, { schemaId: schema.id, data: { tags: ["missing"] } }))
      .rejects.toThrow("ENTRY_FIELD_TYPE_INVALID:tags");
    await expect(createEntry(db, { schemaId: schema.id, data: { tags: [] } }))
      .rejects.toThrow("ENTRY_FIELD_REQUIRED:tags");
  });

  it("requires options only on enum fields", async () => {
    const db = openMigratedSqliteAdapter();

    await expect(createSchema(db, {
      name: "Post",
      slug: "post",
      fields: [{ name: "Status", slug: "status", type: "enum" }],
    })).rejects.toThrow("FIELD_ENUM_OPTIONS_REQUIRED");

    await expect(createSchema(db, {
      name: "Product",
      slug: "product",
      fields: [{ name: "Tags", slug: "tags", type: "multiSelect" }],
    })).rejects.toThrow("FIELD_ENUM_OPTIONS_REQUIRED");

    await expect(createSchema(db, {
      name: "Article",
      slug: "article",
      fields: [{ name: "Title", options: ["draft"], slug: "title", type: "text" }],
    })).rejects.toThrow("FIELD_OPTIONS_FOR_NON_ENUM_FIELD");
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
