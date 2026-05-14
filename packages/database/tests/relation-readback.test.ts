import { describe, expect, it } from "vitest";
import {
  createEntry,
  createSchema,
  getEntryById,
  openMigratedSqliteAdapter,
  updateEntry,
} from "../src/index.js";

describe("relation readback", () => {
  it("reads relation values after create and update", async () => {
    const db = openMigratedSqliteAdapter();
    const authorSchema = await createSchema(db, {
      name: "Author",
      slug: "author",
      fields: [{ name: "Name", slug: "name", type: "text", required: true }],
    });
    const categorySchema = await createSchema(db, {
      name: "Category",
      slug: "category",
      fields: [{ name: "Name", slug: "name", type: "text", required: true }],
    });
    const tagSchema = await createSchema(db, {
      name: "Tag",
      slug: "tag",
      fields: [{ name: "Name", slug: "name", type: "text", required: true }],
    });
    const articleSchema = await createSchema(db, {
      name: "Article",
      slug: "article",
      fields: [
        { name: "Title", slug: "title", type: "text", required: true },
        {
          name: "Category",
          slug: "category",
          type: "relation",
          relationSchemaId: categorySchema.id,
          relationType: "manyToOne",
        },
        {
          name: "Tags",
          slug: "tags",
          type: "relation",
          relationSchemaId: tagSchema.id,
          relationType: "manyToMany",
        },
      ],
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
        },
      ],
    });
    const authorArticlesSchema = await createSchema(db, {
      name: "Author Articles",
      slug: "author-articles",
      fields: [
        {
          name: "Articles",
          slug: "articles",
          type: "relation",
          relationSchemaId: articleSchema.id,
          relationType: "oneToMany",
        },
      ],
    });
    const firstAuthor = await createEntry(db, { schemaId: authorSchema.id, data: { name: "Asha" } });
    const secondAuthor = await createEntry(db, { schemaId: authorSchema.id, data: { name: "Ravi" } });
    const firstCategory = await createEntry(db, {
      schemaId: categorySchema.id,
      data: { name: "Guides" },
    });
    const secondCategory = await createEntry(db, {
      schemaId: categorySchema.id,
      data: { name: "News" },
    });
    const firstTag = await createEntry(db, { schemaId: tagSchema.id, data: { name: "CMS" } });
    const secondTag = await createEntry(db, { schemaId: tagSchema.id, data: { name: "API" } });
    const article = await createEntry(db, {
      schemaId: articleSchema.id,
      data: { category: firstCategory.id, tags: [firstTag.id], title: "Relations" },
    });
    const profile = await createEntry(db, {
      schemaId: profileSchema.id,
      data: { author: firstAuthor.id },
    });
    const authorArticles = await createEntry(db, {
      schemaId: authorArticlesSchema.id,
      data: { articles: [article.id] },
    });

    expect((await getEntryById(db, article.id))?.data).toMatchObject({
      category: firstCategory.id,
      tags: [firstTag.id],
    });
    expect((await getEntryById(db, profile.id))?.data.author).toBe(firstAuthor.id);
    expect((await getEntryById(db, authorArticles.id))?.data.articles).toEqual([article.id]);

    const updatedArticle = await updateEntry(db, article.id, {
      data: {
        category: secondCategory.id,
        tags: [firstTag.id, secondTag.id, firstTag.id],
        title: "Relations Updated",
      },
    });
    const updatedProfile = await updateEntry(db, profile.id, {
      data: { author: secondAuthor.id },
    });
    const updatedAuthorArticles = await updateEntry(db, authorArticles.id, {
      data: { articles: [article.id, article.id] },
    });

    expect(updatedArticle.data).toMatchObject({
      category: secondCategory.id,
      tags: [firstTag.id, secondTag.id],
    });
    expect(updatedProfile.data.author).toBe(secondAuthor.id);
    expect(updatedAuthorArticles.data.articles).toEqual([article.id]);
  });
});
