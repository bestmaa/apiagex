import { describe, expect, it } from "vitest";
import {
  activateWorkflow,
  createWorkflow,
  deactivateWorkflow,
  deleteWorkflow,
  getWorkflowById,
  getWorkflowByMethodPath,
  listWorkflows,
  openMigratedSqliteAdapter,
  updateWorkflow,
  validateWorkflowDraft,
} from "../src/index.js";

const registerDefinition = {
  edges: [
    {
      from: "start",
      id: "edge-start-return",
      to: "return-created",
    },
  ],
  nodes: [
    {
      config: {},
      id: "start",
      type: "routeTrigger",
    },
    {
      config: {
        body: { ok: true },
        status: 201,
      },
      id: "return-created",
      type: "returnResponse",
    },
  ],
  route: {
    method: "POST",
    path: "/register",
  },
  startNodeId: "start",
  version: 1,
};

describe("workflow repository", () => {
  it("creates, lists, and fetches workflow definitions", async () => {
    const db = openMigratedSqliteAdapter();

    const workflow = await createWorkflow(db, {
      active: true,
      definition: registerDefinition,
      method: "post",
      name: "Register user",
      path: "register",
      version: 1,
    });

    expect(workflow.active).toBe(true);
    expect(workflow.method).toBe("POST");
    expect(workflow.path).toBe("/register");
    expect(workflow.definition).toEqual(registerDefinition);
    expect(await getWorkflowById(db, workflow.id)).toEqual(workflow);
    expect(await getWorkflowByMethodPath(db, "POST", "/register")).toEqual(workflow);
    expect(await listWorkflows(db)).toHaveLength(1);
  });

  it("rejects duplicate workflow method and path combinations", async () => {
    const db = openMigratedSqliteAdapter();

    await createWorkflow(db, {
      definition: registerDefinition,
      method: "POST",
      name: "Register user",
      path: "/register",
      version: 1,
    });

    await expect(createWorkflow(db, {
      definition: registerDefinition,
      method: "post",
      name: "Duplicate register",
      path: "register",
      version: 1,
    })).rejects.toThrow("WORKFLOW_ROUTE_CONFLICT");
  });

  it("rejects invalid workflow definitions before save", async () => {
    const db = openMigratedSqliteAdapter();
    const invalidDefinition = {
      ...registerDefinition,
      nodes: [
        {
          config: {},
          id: "start",
          type: "unknownNode",
        },
      ],
    };

    await expect(createWorkflow(db, {
      definition: invalidDefinition,
      method: "POST",
      name: "Invalid workflow",
      path: "/invalid",
      version: 1,
    })).rejects.toThrow("WORKFLOW_NODE_TYPE_UNKNOWN");
    expect(await listWorkflows(db)).toHaveLength(0);
  });

  it("reports validation issues for bad route, duplicate nodes, missing config, and disconnected return", () => {
    const issues = validateWorkflowDraft({
      definition: {
        edges: [],
        nodes: [
          { config: {}, id: "same", type: "queryEntries" },
          { config: {}, id: "same", type: "notSupported" },
        ],
        startNodeId: "same",
        version: 1,
      },
      method: "TRACE",
      path: "http://bad/path",
    });

    expect(issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      "WORKFLOW_BAD_ROUTE_CONFIG",
      "WORKFLOW_NODE_CONFIG_INVALID",
      "WORKFLOW_NODE_DUPLICATE",
      "WORKFLOW_NODE_DISCONNECTED",
      "WORKFLOW_NODE_TYPE_UNKNOWN",
    ]));
  });

  it("updates workflow metadata and keeps method/path unique", async () => {
    const db = openMigratedSqliteAdapter();
    const first = await createWorkflow(db, {
      definition: registerDefinition,
      method: "POST",
      name: "Register user",
      path: "/register",
      version: 1,
    });
    const second = await createWorkflow(db, {
      definition: registerDefinition,
      method: "POST",
      name: "Login user",
      path: "/login",
      version: 1,
    });

    const updated = await updateWorkflow(db, first.id, {
      active: true,
      name: "Register account",
      path: "/auth/register",
      version: 2,
    });

    expect(updated.name).toBe("Register account");
    expect(updated.active).toBe(true);
    expect(updated.path).toBe("/auth/register");
    expect(updated.version).toBe(2);
    await expect(updateWorkflow(db, second.id, {
      method: "POST",
      path: "/auth/register",
    })).rejects.toThrow("WORKFLOW_ROUTE_CONFLICT");
  });

  it("activates, deactivates, and deletes workflows", async () => {
    const db = openMigratedSqliteAdapter();
    const workflow = await createWorkflow(db, {
      definition: registerDefinition,
      method: "POST",
      name: "Register user",
      path: "/register",
      version: 1,
    });

    expect((await activateWorkflow(db, workflow.id)).active).toBe(true);
    expect((await deactivateWorkflow(db, workflow.id)).active).toBe(false);
    expect(await deleteWorkflow(db, workflow.id)).toBe(true);
    expect(await deleteWorkflow(db, workflow.id)).toBe(false);
    expect(await getWorkflowById(db, workflow.id)).toBeUndefined();
  });
});
