import {
  createEntry,
  createSchema,
  openMigratedSqliteAdapter,
} from "@apiagex/database";
import { describe, expect, it } from "vitest";
import {
  createWorkflowExecutionContext,
  executeWorkflowUpdateEntryNode,
  type WorkflowNodeDefinition,
} from "../src/index.js";

function updateNode(config: WorkflowNodeDefinition<"updateEntry">["config"]): WorkflowNodeDefinition<"updateEntry"> {
  return {
    config,
    id: "update-product",
    type: "updateEntry",
  };
}

describe("workflow update entry node", () => {
  it("updates an entry with full replacement data matching entry API semantics", async () => {
    const db = openMigratedSqliteAdapter();
    const schema = await createProductsSchema(db);
    const entry = await createEntry(db, { schemaId: schema.id, data: { name: "Phone", price: 100, status: "draft" } });
    const context = createWorkflowExecutionContext({
      body: { price: 120, status: "active" },
      params: { entryId: entry.id },
    });

    const result = await executeWorkflowUpdateEntryNode(db, context, updateNode({
      data: {
        name: "Phone",
        price: "{{body.price}}",
        status: "{{body.status}}",
      },
      entryId: "{{params.entryId}}",
    }));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output.entry).toMatchObject({
        data: { name: "Phone", price: 120, status: "active" },
        id: entry.id,
      });
    }
    expect(context.steps["update-product"]).toMatchObject({
      entry: { data: { name: "Phone", price: 120, status: "active" } },
    });
  });

  it("uses existing validation for missing required fields and invalid types", async () => {
    const db = openMigratedSqliteAdapter();
    const schema = await createProductsSchema(db);
    const entry = await createEntry(db, { schemaId: schema.id, data: { name: "Phone", price: 100, status: "draft" } });

    const missingRequired = await executeWorkflowUpdateEntryNode(db, createWorkflowExecutionContext(), updateNode({
      data: {
        name: "Phone",
        price: 120,
      },
      entryId: entry.id,
    }));

    expect(missingRequired.ok).toBe(false);
    if (!missingRequired.ok) {
      expect(missingRequired.error.code).toBe("WORKFLOW_NODE_FAILED");
      expect(missingRequired.error.message).toContain("ENTRY_FIELD_REQUIRED:status");
    }
  });

  it("returns predictable errors for missing or unresolved entry ids", async () => {
    const db = openMigratedSqliteAdapter();

    const notFound = await executeWorkflowUpdateEntryNode(db, createWorkflowExecutionContext(), updateNode({
      data: { name: "Phone" },
      entryId: "missing",
    }));
    expect(notFound.ok).toBe(false);
    if (!notFound.ok) expect(notFound.error.code).toBe("WORKFLOW_ENTRY_NOT_FOUND");

    const unresolved = await executeWorkflowUpdateEntryNode(db, createWorkflowExecutionContext(), updateNode({
      data: { name: "Phone" },
      entryId: "",
    }));
    expect(unresolved.ok).toBe(false);
    if (!unresolved.ok) expect(unresolved.error.code).toBe("WORKFLOW_VALIDATION_FAILED");
  });
});

function createProductsSchema(db: ReturnType<typeof openMigratedSqliteAdapter>) {
  return createSchema(db, {
    fields: [
      { name: "Name", slug: "name", type: "text", required: true },
      { name: "Price", slug: "price", type: "number", required: true },
      { name: "Status", slug: "status", type: "text", required: true },
    ],
    name: "Products",
    slug: "products",
  });
}
