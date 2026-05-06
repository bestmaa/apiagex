import { describe, expect, it } from "vitest";
import {
  createRelationFixtureSchemas,
  createSingleRelationFixtureEntries,
  openRelationFixtureDb,
} from "./relation-fixtures.js";

describe("relation test fixtures", () => {
  it("creates reusable relation schemas", () => {
    const db = openRelationFixtureDb();
    const schemas = createRelationFixtureSchemas(db);

    expect(schemas.article.fields.map((field) => field.slug)).toEqual([
      "title",
      "author",
      "category",
      "tags",
    ]);
    expect(schemas.profile.fields[0]).toMatchObject({
      relationSchemaId: schemas.author.id,
      type: "relation",
    });
  });

  it("creates reusable single-relation entries", () => {
    const db = openRelationFixtureDb();
    const schemas = createRelationFixtureSchemas(db);
    const entries = createSingleRelationFixtureEntries(db, schemas);

    expect(entries.article.data).toMatchObject({
      author: entries.author.id,
      category: entries.category.id,
      title: "Relations",
    });
    expect(entries.profile.data.author).toBe(entries.author.id);
  });
});
