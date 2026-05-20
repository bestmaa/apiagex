import {
  createRole,
  createWorkflow,
  getCustomApiRouteByMethodPath,
  openMigratedSqliteAdapter,
  setCustomApiPermission,
} from "@apiagex/database";
import { describe, expect, it } from "vitest";
import { createServer } from "../src/app.js";

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
