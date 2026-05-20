import {
  getCustomApiRouteByMethodPath,
  openMigratedSqliteAdapter,
} from "@apiagex/database";
import { describe, expect, it } from "vitest";
import { createServer } from "../src/app.js";

describe("workflow admin routes", () => {
  it("creates, lists, reads, updates, and deletes workflows", async () => {
    const database = openMigratedSqliteAdapter();
    const server = createServer({ adminAuth: "disabled", database });

    const created = await server.inject({
      method: "POST",
      payload: {
        active: true,
        definition: echoWorkflowDefinition("/echo"),
        method: "POST",
        name: "Echo workflow",
        path: "/echo",
        version: 1,
      },
      url: "/api/admin/workflows",
    });
    const workflowId = created.json().workflow.id;
    const list = await server.inject({ method: "GET", url: "/api/admin/workflows" });
    const read = await server.inject({ method: "GET", url: `/api/admin/workflows/${workflowId}` });
    const updated = await server.inject({
      method: "PUT",
      payload: {
        active: false,
        definition: echoWorkflowDefinition("/echo-updated"),
        method: "POST",
        name: "Echo updated",
        path: "/echo-updated",
        version: 1,
      },
      url: `/api/admin/workflows/${workflowId}`,
    });
    const deleted = await server.inject({ method: "DELETE", url: `/api/admin/workflows/${workflowId}` });

    expect(created.statusCode).toBe(201);
    expect(created.json().workflow.createdBy).toEqual({ email: "admin", id: "admin" });
    expect(list.json().workflows).toHaveLength(1);
    expect(read.json().workflow.id).toBe(workflowId);
    expect(updated.statusCode).toBe(200);
    expect(updated.json().workflow).toMatchObject({ active: false, name: "Echo updated", path: "/echo-updated" });
    expect(deleted.json()).toEqual({ ok: true, deleted: true });
  });

  it("rejects invalid workflow definitions", async () => {
    const server = createServer({ adminAuth: "disabled", database: openMigratedSqliteAdapter() });

    const response = await server.inject({
      method: "POST",
      payload: {
        active: true,
        definition: {
          edges: [],
          nodes: [{ config: {}, id: "start", type: "routeTrigger" }],
          route: { method: "POST", path: "/bad" },
          startNodeId: "start",
          version: 1,
        },
        method: "POST",
        name: "Bad workflow",
        path: "/bad",
        version: 1,
      },
      url: "/api/admin/workflows",
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe("WORKFLOW_NODE_DISCONNECTED");
  });

  it("requires admin auth when admin auth is enabled", async () => {
    const server = createServer({ database: openMigratedSqliteAdapter() });

    const response = await server.inject({ method: "GET", url: "/api/admin/workflows" });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ ok: false, error: "ADMIN_AUTH_REQUIRED" });
  });

  it("syncs active workflow routes into custom API registry after create", async () => {
    const database = openMigratedSqliteAdapter();
    const server = createServer({ adminAuth: "disabled", database });

    await server.inject({
      method: "POST",
      payload: {
        active: true,
        definition: echoWorkflowDefinition("/echo"),
        method: "POST",
        name: "Echo workflow",
        path: "/echo",
        version: 1,
      },
      url: "/api/admin/workflows",
    });

    expect(await getCustomApiRouteByMethodPath(database, "POST", "/api/custom/echo"))
      .toMatchObject({ active: true, permissionKey: "workflow.echo.post" });
  });

  it("runs workflow tests through admin API without public custom permission", async () => {
    const server = createServer({ adminAuth: "disabled", database: openMigratedSqliteAdapter() });
    const created = await server.inject({
      method: "POST",
      payload: {
        active: false,
        definition: echoWorkflowDefinition("/echo"),
        method: "POST",
        name: "Echo workflow",
        path: "/echo",
        version: 1,
      },
      url: "/api/admin/workflows",
    });
    const workflowId = created.json().workflow.id;

    const response = await server.inject({
      method: "POST",
      payload: {
        body: { message: "preview" },
        headers: { "x-preview": "yes" },
        params: { id: "123" },
        query: { debug: true },
      },
      url: `/api/admin/workflows/${workflowId}/test-run`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      ok: true,
      result: {
        error: null,
        executedNodeIds: ["start", "return-echo"],
        ok: true,
        response: {
          body: { ok: true },
          status: 200,
        },
        steps: {
          start: {
            body: { message: "preview" },
            headers: { "x-preview": "yes" },
            params: { id: "123" },
            query: { debug: true },
          },
        },
      },
      workflow: {
        active: false,
        method: "POST",
        path: "/echo",
      },
    });
  });
});

function echoWorkflowDefinition(path: string) {
  return {
    edges: [{ from: "start", id: "edge-start-return", to: "return-echo" }],
    nodes: [
      { config: {}, id: "start", type: "routeTrigger" },
      {
        config: {
          body: { ok: true },
          status: 200,
        },
        id: "return-echo",
        type: "returnResponse",
      },
    ],
    route: { method: "POST", path },
    startNodeId: "start",
    version: 1,
  };
}
