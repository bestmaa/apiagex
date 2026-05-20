import {
  createEntry,
  createSchema,
  openMigratedSqliteAdapter,
} from "@apiagex/database";
import { describe, expect, it } from "vitest";
import {
  createWorkflowExecutionContext,
  executeWorkflowDefinition,
  type WorkflowDefinition,
} from "../src/index.js";

describe("workflow executor", () => {
  it("runs happy path through branch, create, and return nodes", async () => {
    const db = openMigratedSqliteAdapter();
    await createUsersSchema(db);
    const context = createWorkflowExecutionContext({
      body: { email: "new@example.com", password: "password123" },
    });

    const result = await executeWorkflowDefinition(db, context, registerWorkflowDefinition());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.executedNodeIds).toEqual([
        "start",
        "validate-body",
        "find-user",
        "user-exists",
        "create-user",
        "return-created",
      ]);
      expect(result.response.status).toBe(201);
      expect(result.response.body).toMatchObject({
        email: "new@example.com",
        ok: true,
      });
    }
  });

  it("runs existing-user branch path", async () => {
    const db = openMigratedSqliteAdapter();
    const schema = await createUsersSchema(db);
    await createEntry(db, { schemaId: schema.id, data: { email: "old@example.com", password: "password123" } });
    const context = createWorkflowExecutionContext({
      body: { email: "old@example.com", password: "password123" },
    });

    const result = await executeWorkflowDefinition(db, context, registerWorkflowDefinition());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.executedNodeIds).toEqual([
        "start",
        "validate-body",
        "find-user",
        "user-exists",
        "return-existing",
      ]);
      expect(result.response.status).toBe(409);
      expect(result.response.body).toEqual({ error: "USER_EXISTS", ok: false });
    }
  });

  it("stops on node failure", async () => {
    const db = openMigratedSqliteAdapter();
    await createUsersSchema(db);
    const context = createWorkflowExecutionContext({ body: { email: "bad" } });

    const result = await executeWorkflowDefinition(db, context, registerWorkflowDefinition());

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("WORKFLOW_VALIDATION_FAILED");
      expect(result.executedNodeIds).toEqual(["start", "validate-body"]);
      expect(result.shouldStop).toBe(true);
    }
  });

  it("fails when max node execution limit is exceeded", async () => {
    const db = openMigratedSqliteAdapter();
    const context = createWorkflowExecutionContext();
    const definition: WorkflowDefinition = {
      edges: [{ from: "start", id: "loop", to: "start" }],
      nodes: [{ config: {}, id: "start", type: "routeTrigger" }],
      route: { method: "GET", path: "/loop" },
      startNodeId: "start",
      version: 1,
    };

    const result = await executeWorkflowDefinition(db, context, definition, { maxNodeExecutions: 2 });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain("limit exceeded");
      expect(result.executedNodeIds).toEqual(["start", "start"]);
    }
  });
});

function registerWorkflowDefinition(): WorkflowDefinition {
  return {
    edges: [
      { from: "start", id: "edge-start-validate", to: "validate-body" },
      { from: "validate-body", id: "edge-validate-find", to: "find-user" },
      { from: "find-user", id: "edge-find-branch", to: "user-exists" },
      { from: "create-user", id: "edge-create-return", to: "return-created" },
    ],
    nodes: [
      { config: {}, id: "start", type: "routeTrigger" },
      {
        config: {
          fields: {
            email: { required: true, type: "email" },
            password: { minLength: 8, required: true, type: "string" },
          },
        },
        id: "validate-body",
        type: "validateBody",
      },
      {
        config: {
          filters: [{ field: "email", operator: "eq", value: "{{body.email}}" }],
          schema: "users",
        },
        id: "find-user",
        type: "queryEntries",
      },
      {
        config: {
          condition: { left: "{{steps.find-user.total}}", operator: "gt", right: 0 },
          elseNodeId: "create-user",
          thenNodeId: "return-existing",
        },
        id: "user-exists",
        type: "branch",
      },
      {
        config: {
          data: {
            email: "{{body.email}}",
            password: "{{body.password}}",
          },
          schema: "users",
        },
        id: "create-user",
        type: "createEntry",
      },
      {
        config: {
          body: { error: "USER_EXISTS", ok: false },
          status: 409,
        },
        id: "return-existing",
        type: "returnResponse",
      },
      {
        config: {
          body: {
            email: "{{steps.create-user.entry.data.email}}",
            id: "{{steps.create-user.entry.id}}",
            ok: true,
          },
          status: 201,
        },
        id: "return-created",
        type: "returnResponse",
      },
    ],
    route: { method: "POST", path: "/register" },
    startNodeId: "start",
    version: 1,
  };
}

function createUsersSchema(db: ReturnType<typeof openMigratedSqliteAdapter>) {
  return createSchema(db, {
    fields: [
      { name: "Email", slug: "email", type: "text", required: true },
      { name: "Password", slug: "password", type: "text", required: true },
    ],
    name: "Users",
    slug: "users",
  });
}
