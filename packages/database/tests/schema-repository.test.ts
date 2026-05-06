import { describe, expect, it } from "vitest";
import {
  createSchema,
  deleteSchema,
  listSchemas,
  migrateMvpDatabase,
  openSqliteDatabase,
} from "../src/index.js";

describe("schema repository", () => {
  it("creates schemas with ordered fields", () => {
    const db = openMigratedDb();

    const schema = createSchema(db, {
      name: "Post",
      slug: "post",
      fields: [
        { name: "Title", slug: "title", type: "text", required: true },
        { name: "Body", slug: "body", type: "longText" },
      ],
    });

    expect(schema.slug).toBe("post");
    expect(schema.fields.map((field) => field.slug)).toEqual(["title", "body"]);
    expect(listSchemas(db)).toHaveLength(1);
  });

  it("allows relation fields to existing schemas", () => {
    const db = openMigratedDb();
    const author = createSchema(db, {
      name: "Author",
      slug: "author",
      fields: [{ name: "Name", slug: "name", type: "text" }],
    });

    const book = createSchema(db, {
      name: "Book",
      slug: "book",
      fields: [
        {
          name: "Author",
          slug: "author",
          type: "relation",
          relationSchemaId: author.id,
          relationType: "manyToOne",
        },
      ],
    });

    expect(book.fields[0]?.relationSchemaId).toBe(author.id);
    expect(book.fields[0]?.relationType).toBe("manyToOne");
  });

  it("blocks relation fields without an existing target", () => {
    const db = openMigratedDb();

    expect(() =>
      createSchema(db, {
        name: "Book",
        slug: "book",
        fields: [
          {
            name: "Author",
            slug: "author",
            type: "relation",
            relationSchemaId: "missing",
          },
        ],
      }),
    ).toThrow("RELATION_TARGET_MISSING");
  });

  it("blocks invalid relation type metadata", () => {
    const db = openMigratedDb();
    const author = createSchema(db, {
      name: "Author",
      slug: "author",
      fields: [{ name: "Name", slug: "name", type: "text" }],
    });

    expect(() =>
      createSchema(db, {
        name: "Book",
        slug: "book",
        fields: [
          {
            name: "Author",
            slug: "author",
            type: "relation",
            relationSchemaId: author.id,
            relationType: "wrong",
          },
        ],
      }),
    ).toThrow("RELATION_TYPE_INVALID");
  });

  it("blocks relation metadata on non-relation fields", () => {
    const db = openMigratedDb();
    const author = createSchema(db, {
      name: "Author",
      slug: "author",
      fields: [{ name: "Name", slug: "name", type: "text" }],
    });

    expect(() =>
      createSchema(db, {
        name: "Book",
        slug: "book",
        fields: [
          {
            name: "Title",
            slug: "title",
            type: "text",
            relationSchemaId: author.id,
          },
        ],
      }),
    ).toThrow("RELATION_METADATA_FOR_NON_RELATION_FIELD");
  });

  it("blocks deleting relation target schemas", () => {
    const db = openMigratedDb();
    const author = createSchema(db, {
      name: "Author",
      slug: "author",
      fields: [{ name: "Name", slug: "name", type: "text" }],
    });
    const book = createSchema(db, {
      name: "Book",
      slug: "book",
      fields: [
        {
          name: "Author",
          slug: "author",
          type: "relation",
          relationSchemaId: author.id,
          relationType: "manyToOne",
        },
      ],
    });

    expect(() => deleteSchema(db, author.id)).toThrow(`RELATION_SCHEMA_REFERENCED:${author.id}`);
    expect(() => deleteSchema(db, book.id)).not.toThrow();
  });
});

function openMigratedDb() {
  const db = openSqliteDatabase();
  migrateMvpDatabase(db);
  return db;
}
