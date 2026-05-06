import { describe, expect, it } from "vitest";
import {
  createEntry,
  createSchema,
  entryDataReferences,
  listEntryDataRows,
  migrateMvpDatabase,
  openSqliteDatabase,
  parseEntryData,
  relationTypeOf,
  schemaEntriesUseField,
} from "../src/index.js";

describe("relation repository helpers", () => {
  it("detects relation references in entry data", () => {
    expect(entryDataReferences({ author: "entry-1" }, "entry-1")).toBe(true);
    expect(entryDataReferences({ tags: ["entry-1", "entry-2"] }, "entry-2")).toBe(true);
    expect(entryDataReferences({ title: "entry-1" }, "missing")).toBe(false);
  });

  it("reads entry rows and checks used fields", () => {
    const db = openSqliteDatabase();
    migrateMvpDatabase(db);
    const schema = createSchema(db, {
      name: "Article",
      slug: "article",
      fields: [{ name: "Title", slug: "title", type: "text" }],
    });
    createEntry(db, { schemaId: schema.id, data: { title: "Hello" } });

    const rows = listEntryDataRows(db, "WHERE schema_id = ?", [schema.id]);

    expect(parseEntryData(rows[0]?.dataJson ?? "{}")).toEqual({ title: "Hello" });
    expect(schemaEntriesUseField(db, schema.id, "title")).toBe(true);
    expect(schemaEntriesUseField(db, schema.id, "missing")).toBe(false);
  });

  it("defaults legacy relation fields to many-to-one", () => {
    expect(
      relationTypeOf({
        id: "field-1",
        name: "Author",
        position: 0,
        relationSchemaId: "schema-1",
        required: false,
        schemaId: "schema-2",
        slug: "author",
        type: "relation",
      }),
    ).toBe("manyToOne");
  });
});
