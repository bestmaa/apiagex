import {
  createApiToken,
  createRole,
  createWorkflow,
  getCustomApiRouteByMethodPath,
  listWorkflowRuns,
  openMigratedSqliteAdapter,
  setCustomApiPermission,
} from "@apiagex/database";
import { describe, expect, it } from "vitest";
import { createServer } from "../src/app.js";
import { bootstrapOwner, loginOwner } from "../src/owner-bootstrap.js";

describe("workflow API routes", () => {
  it("registers active workflow routes under /api/custom", async () => {
    const database = openMigratedSqliteAdapter();
    const publicRole = await createRole(database, { description: "Public", name: "public" });
    await createWorkflow(database, {
      active: true,
      definition: echoWorkflowDefinition(),
      method: "POST",
      name: "Echo workflow",
      path: "/echo",
      version: 1,
    });
    const server = createServer({ adminAuth: "disabled", database });
    await server.ready();
    const route = await getCustomApiRouteByMethodPath(database, "POST", "/api/custom/echo");
    if (!route) throw new Error("WORKFLOW_ROUTE_NOT_SYNCED");
    await setCustomApiPermission(database, {
      allowed: true,
      customApiRouteId: route.id,
      roleId: publicRole.id,
    });

    const response = await server.inject({
      method: "POST",
      payload: { message: "hello" },
      url: "/api/custom/echo",
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({ message: "hello", ok: true });
  });

  it("does not register inactive workflow routes", async () => {
    const database = openMigratedSqliteAdapter();
    await createWorkflow(database, {
      active: false,
      definition: echoWorkflowDefinition(),
      method: "POST",
      name: "Inactive workflow",
      path: "/inactive",
      version: 1,
    });
    const server = createServer({ adminAuth: "disabled", database });
    await server.ready();

    const response = await server.inject({
      method: "POST",
      payload: { message: "hello" },
      url: "/api/custom/inactive",
    });

    expect(response.statusCode).toBe(404);
  });

  it("coexists with code-based custom routes", async () => {
    const database = openMigratedSqliteAdapter();
    const publicRole = await createRole(database, { description: "Public", name: "public" });
    await createWorkflow(database, {
      active: true,
      definition: echoWorkflowDefinition(),
      method: "POST",
      name: "Echo workflow",
      path: "/echo",
      version: 1,
    });
    const server = createServer({
      adminAuth: "disabled",
      database,
      customRoutes(app) {
        app.get("/healthz", async () => ({ ok: true, source: "code" }));
      },
    });
    await server.ready();
    const workflowRoute = await getCustomApiRouteByMethodPath(database, "POST", "/api/custom/echo");
    const codeRoute = await getCustomApiRouteByMethodPath(database, "GET", "/api/custom/healthz");
    if (!workflowRoute || !codeRoute) throw new Error("CUSTOM_ROUTES_NOT_SYNCED");
    await setCustomApiPermission(database, { allowed: true, customApiRouteId: workflowRoute.id, roleId: publicRole.id });
    await setCustomApiPermission(database, { allowed: true, customApiRouteId: codeRoute.id, roleId: publicRole.id });

    const workflow = await server.inject({ method: "POST", payload: { message: "hello" }, url: "/api/custom/echo" });
    const code = await server.inject({ method: "GET", url: "/api/custom/healthz" });

    expect(workflow.statusCode).toBe(201);
    expect(code.statusCode).toBe(200);
    expect(code.json()).toEqual({ ok: true, source: "code" });
  });

  it("blocks workflow routes by default and allows API tokens with custom API permission", async () => {
    const database = openMigratedSqliteAdapter();
    const role = await createRole(database, { description: "Workflow client", name: "workflow-client" });
    const token = await createApiToken(database, { roleId: role.id });
    await createWorkflow(database, {
      active: true,
      definition: echoWorkflowDefinition(),
      method: "POST",
      name: "Echo workflow",
      path: "/echo",
      version: 1,
    });
    const server = createServer({ adminAuth: "disabled", database });
    await server.ready();
    const route = await getCustomApiRouteByMethodPath(database, "POST", "/api/custom/echo");
    if (!route) throw new Error("WORKFLOW_ROUTE_NOT_SYNCED");

    const blocked = await server.inject({ method: "POST", payload: { message: "hello" }, url: "/api/custom/echo" });
    await setCustomApiPermission(database, { allowed: true, customApiRouteId: route.id, roleId: role.id });
    const allowed = await server.inject({
      headers: { authorization: `Bearer ${token.token}` },
      method: "POST",
      payload: { message: "hello" },
      url: "/api/custom/echo",
    });

    expect(blocked.statusCode).toBe(403);
    expect(blocked.json()).toEqual({ ok: false, error: "CUSTOM_API_PERMISSION_DENIED" });
    expect(allowed.statusCode).toBe(201);
    expect(allowed.json()).toEqual({ message: "hello", ok: true });
  });

  it("records safe workflow run history for allowed workflow requests", async () => {
    const database = openMigratedSqliteAdapter();
    const role = await createRole(database, { description: "Workflow client", name: "workflow-client" });
    const token = await createApiToken(database, { roleId: role.id });
    const workflow = await createWorkflow(database, {
      active: true,
      definition: echoWorkflowDefinition(),
      method: "POST",
      name: "Echo workflow",
      path: "/echo",
      version: 1,
    });
    const server = createServer({ adminAuth: "disabled", database });
    await server.ready();
    const route = await getCustomApiRouteByMethodPath(database, "POST", "/api/custom/echo");
    if (!route) throw new Error("WORKFLOW_ROUTE_NOT_SYNCED");
    await setCustomApiPermission(database, { allowed: true, customApiRouteId: route.id, roleId: role.id });

    const response = await server.inject({
      headers: { authorization: `Bearer ${token.token}`, "x-custom-secret": "header-secret" },
      method: "POST",
      payload: { message: "hello", password: "not stored" },
      url: "/api/custom/echo?debug=true",
    });
    const runs = await listWorkflowRuns(database, workflow.id);

    expect(response.statusCode).toBe(201);
    expect(runs).toHaveLength(1);
    expect(runs[0]).toMatchObject({
      errorCode: null,
      status: "success",
      statusCode: 201,
      workflowId: workflow.id,
    });
    expect(runs[0]?.request).toMatchObject({
      headers: {
        authorization: "[redacted]",
        "x-custom-secret": "[redacted]",
      },
      method: "POST",
      params: {},
      path: "/api/custom/echo",
      query: { debug: "true" },
    });
    expect(JSON.stringify(runs[0])).not.toContain(token.token);
    expect(JSON.stringify(runs[0])).not.toContain("not stored");
  });

  it("does not let owner admin sessions bypass workflow API permissions", async () => {
    const database = openMigratedSqliteAdapter();
    await bootstrapOwner(database, { email: "owner@example.com", password: "password123" });
    const login = await loginOwner(database, { email: "owner@example.com", password: "password123" });
    await createWorkflow(database, {
      active: true,
      definition: echoWorkflowDefinition(),
      method: "POST",
      name: "Echo workflow",
      path: "/echo",
      version: 1,
    });
    const server = createServer({ database });
    await server.ready();

    const response = await server.inject({
      headers: { "x-apiagex-admin-token": login.token },
      method: "POST",
      payload: { message: "hello" },
      url: "/api/custom/echo",
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toEqual({ ok: false, error: "CUSTOM_API_PERMISSION_DENIED" });
  });
});

function echoWorkflowDefinition() {
  return {
    edges: [
      { from: "start", id: "edge-start-return", to: "return-echo" },
    ],
    nodes: [
      { config: {}, id: "start", type: "routeTrigger" },
      {
        config: {
          body: {
            message: "{{body.message}}",
            ok: true,
          },
          status: 201,
        },
        id: "return-echo",
        type: "returnResponse",
      },
    ],
    route: { method: "POST", path: "/echo" },
    startNodeId: "start",
    version: 1,
  };
}
