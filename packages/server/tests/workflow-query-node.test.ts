import {
  createEntry,
  createSchema,
  openMigratedSqliteAdapter,
} from "@apiagex/database";
import { describe, expect, it } from "vitest";
import {
  createWorkflowExecutionContext,
  executeWorkflowQueryEntriesNode,
  type WorkflowNodeDefinition,
} from "../src/index.js";

function queryNode(config: WorkflowNodeDefinition<"queryEntries">["config"]): WorkflowNodeDefinition<"queryEntries"> {
  return {
    config,
    id: "find-products",
    type: "queryEntries",
  };
}

describe("workflow query entries node", () => {
  it("queries entries by schema slug with search, limit, and offset", async () => {
    const db = openMigratedSqliteAdapter();
    const schema = await createProductsSchema(db);
    await createEntry(db, { schemaId: schema.id, data: { name: "Phone", price: 100, status: "active" } });
    await createEntry(db, { schemaId: schema.id, data: { name: "Laptop", price: 200, status: "active" } });
    await createEntry(db, { schemaId: schema.id, data: { name: "Phone case", price: 20, status: "draft" } });
    const context = createWorkflowExecutionContext({ query: { search: "phone" } });

    const result = await executeWorkflowQueryEntriesNode(db, context, queryNode({
      limit: 1,
      offset: 1,
      schema: "products",
      search: "{{query.search}}",
    }));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output.total).toBe(2);
      expect(result.output.entries).toHaveLength(1);
      expect(result.output.entries[0]).toMatchObject({
        data: { name: "Phone case", price: 20, status: "draft" },
      });
    }
    expect(context.steps["find-products"]).toMatchObject({ total: 2, limit: 1, offset: 1 });
  });

  it("applies field filters with template values", async () => {
    const db = openMigratedSqliteAdapter();
    const schema = await createProductsSchema(db);
    await createEntry(db, { schemaId: schema.id, data: { name: "Phone", price: 100, status: "active" } });
    await createEntry(db, { schemaId: schema.id, data: { name: "Phone case", price: 20, status: "draft" } });
    const context = createWorkflowExecutionContext({ body: { minPrice: 50, status: "active" } });

    const result = await executeWorkflowQueryEntriesNode(db, context, queryNode({
      filters: [
        { field: "status", operator: "eq", value: "{{body.status}}" },
        { field: "price", operator: "gte", value: "{{body.minPrice}}" },
      ],
      schema: "products",
    }));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output.total).toBe(1);
      expect(result.output.entries[0]).toMatchObject({
        data: { name: "Phone", price: 100, status: "active" },
      });
    }
  });

  it("returns predictable failure for missing schema or bad template", async () => {
    const db = openMigratedSqliteAdapter();
    const missing = await executeWorkflowQueryEntriesNode(db, createWorkflowExecutionContext(), queryNode({
      schema: "missing",
    }));

    expect(missing.ok).toBe(false);
    if (!missing.ok) {
      expect(missing.error.code).toBe("WORKFLOW_SCHEMA_NOT_FOUND");
      expect(missing.shouldStop).toBe(true);
    }

    const schema = await createProductsSchema(db);
    await createEntry(db, { schemaId: schema.id, data: { name: "Phone", price: 100, status: "active" } });
    const badTemplate = await executeWorkflowQueryEntriesNode(db, createWorkflowExecutionContext(), queryNode({
      filters: [{ field: "status", operator: "eq", value: "{{body.status}}" }],
      schema: "products",
    }));

    expect(badTemplate.ok).toBe(false);
    if (!badTemplate.ok) {
      expect(badTemplate.error.code).toBe("WORKFLOW_NODE_FAILED");
      expect(badTemplate.shouldStop).toBe(true);
    }
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
