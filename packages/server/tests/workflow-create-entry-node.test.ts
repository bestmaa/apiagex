import {
  createSchema,
  openMigratedSqliteAdapter,
} from "@apiagex/database";
import { describe, expect, it } from "vitest";
import {
  createWorkflowExecutionContext,
  executeWorkflowCreateEntryNode,
  type WorkflowNodeDefinition,
} from "../src/index.js";

function createNode(config: WorkflowNodeDefinition<"createEntry">["config"]): WorkflowNodeDefinition<"createEntry"> {
  return {
    config,
    id: "create-product",
    type: "createEntry",
  };
}

describe("workflow create entry node", () => {
  it("creates an entry from template-mapped request data", async () => {
    const db = openMigratedSqliteAdapter();
    const schema = await createProductsSchema(db);
    const context = createWorkflowExecutionContext({
      body: { name: "Phone", price: 100 },
      query: { status: "active" },
    });

    const result = await executeWorkflowCreateEntryNode(db, context, createNode({
      data: {
        name: "{{body.name}}",
        price: "{{body.price}}",
        status: "{{query.status}}",
      },
      schema: "products",
    }));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output.entry).toMatchObject({
        data: { name: "Phone", price: 100, status: "active" },
        schemaId: schema.id,
      });
    }
    expect(context.steps["create-product"]).toMatchObject({
      entry: { data: { name: "Phone", price: 100, status: "active" } },
    });
  });

  it("uses existing entry validation for unknown fields and invalid types", async () => {
    const db = openMigratedSqliteAdapter();
    await createProductsSchema(db);
    const context = createWorkflowExecutionContext({ body: { name: "Phone", price: "bad" } });

    const invalidType = await executeWorkflowCreateEntryNode(db, context, createNode({
      data: {
        name: "{{body.name}}",
        price: "{{body.price}}",
        status: "active",
      },
      schema: "products",
    }));

    expect(invalidType.ok).toBe(false);
    if (!invalidType.ok) {
      expect(invalidType.error.code).toBe("WORKFLOW_NODE_FAILED");
      expect(invalidType.error.message).toContain("ENTRY_FIELD_TYPE_INVALID:price");
    }

    const unknownField = await executeWorkflowCreateEntryNode(db, context, createNode({
      data: {
        name: "Phone",
        price: 100,
        status: "active",
        unknown: true,
      },
      schema: "products",
    }));

    expect(unknownField.ok).toBe(false);
    if (!unknownField.ok) {
      expect(unknownField.error.message).toBe("ENTRY_FIELD_UNKNOWN");
    }
  });

  it("returns schema-not-found for missing schemas", async () => {
    const db = openMigratedSqliteAdapter();

    const result = await executeWorkflowCreateEntryNode(db, createWorkflowExecutionContext(), createNode({
      data: { name: "Phone" },
      schema: "missing",
    }));

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("WORKFLOW_SCHEMA_NOT_FOUND");
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
