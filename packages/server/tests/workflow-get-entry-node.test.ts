import {
  createEntry,
  createSchema,
  openMigratedSqliteAdapter,
} from "@apiagex/database";
import { describe, expect, it } from "vitest";
import {
  createWorkflowExecutionContext,
  executeWorkflowGetEntryNode,
  type WorkflowNodeDefinition,
} from "../src/index.js";

function getNode(entryId: WorkflowNodeDefinition<"getEntry">["config"]["entryId"]): WorkflowNodeDefinition<"getEntry"> {
  return {
    config: { entryId },
    id: "get-product",
    type: "getEntry",
  };
}

describe("workflow get entry node", () => {
  it("reads one entry by resolved entry id and stores step output", async () => {
    const db = openMigratedSqliteAdapter();
    const schema = await createProductsSchema(db);
    const entry = await createEntry(db, { schemaId: schema.id, data: { name: "Phone" } });
    const context = createWorkflowExecutionContext({ params: { entryId: entry.id } });

    const result = await executeWorkflowGetEntryNode(db, context, getNode("{{params.entryId}}"));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output.entry).toMatchObject({
        data: { name: "Phone" },
        id: entry.id,
        schemaId: schema.id,
      });
    }
    expect(context.steps["get-product"]).toMatchObject({
      entry: { id: entry.id },
    });
  });

  it("returns predictable not-found and unresolved-id errors", async () => {
    const db = openMigratedSqliteAdapter();

    const notFound = await executeWorkflowGetEntryNode(db, createWorkflowExecutionContext(), getNode("missing"));
    expect(notFound.ok).toBe(false);
    if (!notFound.ok) {
      expect(notFound.error.code).toBe("WORKFLOW_ENTRY_NOT_FOUND");
      expect(notFound.shouldStop).toBe(true);
    }

    const unresolved = await executeWorkflowGetEntryNode(db, createWorkflowExecutionContext(), getNode(""));
    expect(unresolved.ok).toBe(false);
    if (!unresolved.ok) {
      expect(unresolved.error.code).toBe("WORKFLOW_VALIDATION_FAILED");
    }
  });

  it("returns node failure for bad templates", async () => {
    const db = openMigratedSqliteAdapter();

    const result = await executeWorkflowGetEntryNode(db, createWorkflowExecutionContext(), getNode("{{body.entryId}}"));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("WORKFLOW_NODE_FAILED");
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
