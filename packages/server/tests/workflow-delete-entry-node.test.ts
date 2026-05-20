import {
  createEntry,
  createSchema,
  getEntryById,
  openMigratedSqliteAdapter,
} from "@apiagex/database";
import { describe, expect, it } from "vitest";
import {
  createWorkflowExecutionContext,
  executeWorkflowDeleteEntryNode,
  type WorkflowNodeDefinition,
} from "../src/index.js";

function deleteNode(entryId: WorkflowNodeDefinition<"deleteEntry">["config"]["entryId"]): WorkflowNodeDefinition<"deleteEntry"> {
  return {
    config: { entryId },
    id: "delete-product",
    type: "deleteEntry",
  };
}

describe("workflow delete entry node", () => {
  it("deletes an entry by resolved entry id and stores output", async () => {
    const db = openMigratedSqliteAdapter();
    const schema = await createProductsSchema(db);
    const entry = await createEntry(db, { schemaId: schema.id, data: { name: "Phone" } });
    const context = createWorkflowExecutionContext({ params: { entryId: entry.id } });

    const result = await executeWorkflowDeleteEntryNode(db, context, deleteNode("{{params.entryId}}"));

    expect(result).toEqual({ ok: true, output: { deleted: true, entryId: entry.id }, shouldStop: false });
    expect(context.steps["delete-product"]).toEqual({ deleted: true, entryId: entry.id });
    expect(await getEntryById(db, entry.id)).toBeUndefined();
  });

  it("does not run delete for empty or missing ids", async () => {
    const db = openMigratedSqliteAdapter();

    const empty = await executeWorkflowDeleteEntryNode(db, createWorkflowExecutionContext(), deleteNode(""));
    expect(empty.ok).toBe(false);
    if (!empty.ok) expect(empty.error.code).toBe("WORKFLOW_VALIDATION_FAILED");

    const missing = await executeWorkflowDeleteEntryNode(db, createWorkflowExecutionContext(), deleteNode("missing"));
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.error.code).toBe("WORKFLOW_ENTRY_NOT_FOUND");
  });

  it("uses existing relation delete guards", async () => {
    const db = openMigratedSqliteAdapter();
    const authorSchema = await createSchema(db, {
      fields: [{ name: "Name", slug: "name", type: "text", required: true }],
      name: "Authors",
      slug: "authors",
    });
    const bookSchema = await createSchema(db, {
      fields: [
        { name: "Title", slug: "title", type: "text", required: true },
        {
          name: "Author",
          relationSchemaId: authorSchema.id,
          slug: "author",
          type: "relation",
          required: true,
        },
      ],
      name: "Books",
      slug: "books",
    });
    const author = await createEntry(db, { schemaId: authorSchema.id, data: { name: "Octavia Butler" } });
    await createEntry(db, { schemaId: bookSchema.id, data: { title: "Kindred", author: author.id } });

    const result = await executeWorkflowDeleteEntryNode(db, createWorkflowExecutionContext(), deleteNode(author.id));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("WORKFLOW_NODE_FAILED");
      expect(result.error.message).toContain("RELATION_ENTRY_REFERENCED");
    }
  });
});

function createProductsSchema(db: ReturnType<typeof openMigratedSqliteAdapter>) {
  return createSchema(db, {
    fields: [{ name: "Name", slug: "name", type: "text", required: true }],
    name: "Products",
    slug: "products",
  });
}
