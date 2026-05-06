import {
  createEntry,
  createSchema,
  migrateMvpDatabase,
  openSqliteDatabase,
  type EntryRecord,
  type SchemaRecord,
  type SqliteDatabase,
} from "../src/index.js";

export type RelationFixtureSchemas = {
  article: SchemaRecord;
  author: SchemaRecord;
  category: SchemaRecord;
  profile: SchemaRecord;
  tag: SchemaRecord;
};

export type RelationFixtureEntries = {
  article: EntryRecord;
  author: EntryRecord;
  category: EntryRecord;
  profile: EntryRecord;
  tag: EntryRecord;
};

export function openRelationFixtureDb(): SqliteDatabase {
  const db = openSqliteDatabase();
  migrateMvpDatabase(db);
  return db;
}

export function createRelationFixtureSchemas(db: SqliteDatabase): RelationFixtureSchemas {
  const author = createSchema(db, {
    name: "Author",
    slug: "author",
    fields: [{ name: "Name", slug: "name", type: "text", required: true }],
  });
  const category = createSchema(db, {
    name: "Category",
    slug: "category",
    fields: [{ name: "Name", slug: "name", type: "text", required: true }],
  });
  const tag = createSchema(db, {
    name: "Tag",
    slug: "tag",
    fields: [{ name: "Name", slug: "name", type: "text", required: true }],
  });
  const profile = createSchema(db, {
    name: "Profile",
    slug: "profile",
    fields: [
      {
        name: "Author",
        slug: "author",
        type: "relation",
        relationSchemaId: author.id,
        relationType: "oneToOne",
      },
    ],
  });
  const article = createSchema(db, {
    name: "Article",
    slug: "article",
    fields: [
      { name: "Title", slug: "title", type: "text", required: true },
      {
        name: "Author",
        slug: "author",
        type: "relation",
        relationSchemaId: author.id,
        relationType: "manyToOne",
      },
      {
        name: "Category",
        slug: "category",
        type: "relation",
        relationSchemaId: category.id,
        relationType: "manyToOne",
      },
      {
        name: "Tags",
        slug: "tags",
        type: "relation",
        relationSchemaId: tag.id,
        relationType: "manyToMany",
      },
    ],
  });
  return { article, author, category, profile, tag };
}

export function createSingleRelationFixtureEntries(
  db: SqliteDatabase,
  schemas: RelationFixtureSchemas,
): RelationFixtureEntries {
  const author = createEntry(db, { schemaId: schemas.author.id, data: { name: "Asha" } });
  const category = createEntry(db, {
    schemaId: schemas.category.id,
    data: { name: "Guides" },
  });
  const tag = createEntry(db, { schemaId: schemas.tag.id, data: { name: "CMS" } });
  const profile = createEntry(db, {
    schemaId: schemas.profile.id,
    data: { author: author.id },
  });
  const article = createEntry(db, {
    schemaId: schemas.article.id,
    data: { author: author.id, category: category.id, title: "Relations" },
  });
  return { article, author, category, profile, tag };
}
