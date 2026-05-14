import {
  createEntry,
  createSchema,
  openMigratedSqliteAdapter,
  type ApiagexDatabase,
  type EntryRecord,
  type SchemaRecord,
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
  tag: EntryRecord;
};

export function openRelationFixtureDb(): ApiagexDatabase {
  return openMigratedSqliteAdapter();
}

export async function createRelationFixtureSchemas(db: ApiagexDatabase): Promise<RelationFixtureSchemas> {
  const author = await createSchema(db, {
    name: "Author",
    slug: "author",
    fields: [{ name: "Name", slug: "name", type: "text", required: true }],
  });
  const category = await createSchema(db, {
    name: "Category",
    slug: "category",
    fields: [{ name: "Name", slug: "name", type: "text", required: true }],
  });
  const tag = await createSchema(db, {
    name: "Tag",
    slug: "tag",
    fields: [{ name: "Name", slug: "name", type: "text", required: true }],
  });
  const profile = await createSchema(db, {
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
  const article = await createSchema(db, {
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
  db: ApiagexDatabase,
  schemas: RelationFixtureSchemas,
): Promise<RelationFixtureEntries> {
  return createEntries(db, schemas);
}

async function createEntries(
  db: ApiagexDatabase,
  schemas: RelationFixtureSchemas,
): Promise<RelationFixtureEntries> {
  const author = await createEntry(db, { schemaId: schemas.author.id, data: { name: "Asha" } });
  const category = await createEntry(db, {
    schemaId: schemas.category.id,
    data: { name: "Guides" },
  });
  const tag = await createEntry(db, { schemaId: schemas.tag.id, data: { name: "CMS" } });
  const article = await createEntry(db, {
    schemaId: schemas.article.id,
    data: { author: author.id, category: category.id, title: "Relations" },
  });
  return { article, author, category, tag };
}
