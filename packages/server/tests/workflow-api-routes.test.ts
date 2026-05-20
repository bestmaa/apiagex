import {
  createApiToken,
  createEntry,
  createRole,
  createSchema,
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

  it("serves workflows created after server startup", async () => {
    const database = openMigratedSqliteAdapter();
    const publicRole = await createRole(database, { description: "Public", name: "public" });
    const server = createServer({ adminAuth: "disabled", database });
    await server.ready();

    const createResponse = await server.inject({
      method: "POST",
      payload: {
        active: true,
        definition: echoWorkflowDefinition(),
        method: "POST",
        name: "Runtime echo workflow",
        path: "/echo",
        version: 1,
      },
      url: "/api/admin/workflows",
    });
    const route = await getCustomApiRouteByMethodPath(database, "POST", "/api/custom/echo");
    if (!route) throw new Error("WORKFLOW_ROUTE_NOT_SYNCED");
    await setCustomApiPermission(database, { allowed: true, customApiRouteId: route.id, roleId: publicRole.id });

    const response = await server.inject({
      method: "POST",
      payload: { message: "hello" },
      url: "/api/custom/echo",
    });

    expect(createResponse.statusCode).toBe(201);
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

  it("runs the order status workflow and blocks invalid transitions", async () => {
    const database = openMigratedSqliteAdapter();
    const publicRole = await createRole(database, { description: "Public", name: "public" });
    const orderSchema = await createSchema(database, {
      fields: [{ name: "Status", required: true, slug: "status", type: "text" }],
      name: "Orders",
      slug: "orders",
    });
    const order = await createEntry(database, { data: { status: "pending" }, schemaId: orderSchema.id });
    await createWorkflow(database, {
      active: true,
      definition: orderStatusWorkflowDefinition(),
      method: "POST",
      name: "Order status template",
      path: "/orders/status",
      version: 1,
    });
    const server = createServer({ adminAuth: "disabled", database });
    await server.ready();
    const route = await getCustomApiRouteByMethodPath(database, "POST", "/api/custom/orders/status");
    if (!route) throw new Error("WORKFLOW_ROUTE_NOT_SYNCED");
    await setCustomApiPermission(database, { allowed: true, customApiRouteId: route.id, roleId: publicRole.id });

    const valid = await server.inject({
      method: "POST",
      payload: { orderId: order.id, status: "preparing" },
      url: "/api/custom/orders/status",
    });
    const invalid = await server.inject({
      method: "POST",
      payload: { orderId: order.id, status: "completed" },
      url: "/api/custom/orders/status",
    });

    expect(valid.statusCode).toBe(200);
    expect(valid.json()).toMatchObject({ ok: true, status: "preparing" });
    expect(valid.json().order.data.status).toBe("preparing");
    expect(invalid.statusCode).toBe(409);
    expect(invalid.json()).toEqual({
      currentStatus: "preparing",
      error: "ORDER_STATUS_TRANSITION_INVALID",
      ok: false,
      requestedStatus: "completed",
    });
  });

  it("runs the report workflow as a bounded read-only query", async () => {
    const database = openMigratedSqliteAdapter();
    const publicRole = await createRole(database, { description: "Public", name: "public" });
    const orderSchema = await createSchema(database, {
      fields: [{ name: "Status", required: true, slug: "status", type: "text" }],
      name: "Orders",
      slug: "orders",
    });
    await createEntry(database, { data: { status: "pending" }, schemaId: orderSchema.id });
    await createEntry(database, { data: { status: "ready" }, schemaId: orderSchema.id });
    await createWorkflow(database, {
      active: true,
      definition: reportWorkflowDefinition(),
      method: "GET",
      name: "Orders report template",
      path: "/reports/orders",
      version: 1,
    });
    const server = createServer({ adminAuth: "disabled", database });
    await server.ready();
    const route = await getCustomApiRouteByMethodPath(database, "GET", "/api/custom/reports/orders");
    if (!route) throw new Error("WORKFLOW_ROUTE_NOT_SYNCED");
    await setCustomApiPermission(database, { allowed: true, customApiRouteId: route.id, roleId: publicRole.id });

    const response = await server.inject({ method: "GET", url: "/api/custom/reports/orders" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ limit: 50, offset: 0, ok: true, total: 2 });
    expect(response.json().entries).toHaveLength(2);
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

function orderStatusWorkflowDefinition() {
  return {
    edges: [
      { from: "start", id: "edge-start-validate-order-id", to: "validate-order-id" },
      { from: "validate-order-id", id: "edge-validate-order-id-validate-status", to: "validate-status" },
      { from: "validate-status", id: "edge-validate-status-get-order", to: "get-order" },
      { from: "get-order", id: "edge-get-order-check-current-pending", to: "check-current-pending" },
      { from: "check-current-pending", id: "edge-check-current-pending-check-pending-preparing", to: "check-pending-preparing" },
      { from: "check-current-pending", id: "edge-check-current-pending-check-current-preparing", to: "check-current-preparing" },
      { from: "check-pending-preparing", id: "edge-check-pending-preparing-update-order", to: "update-order" },
      { from: "check-pending-preparing", id: "edge-check-pending-preparing-check-pending-cancelled", to: "check-pending-cancelled" },
      { from: "check-pending-cancelled", id: "edge-check-pending-cancelled-update-order", to: "update-order" },
      { from: "check-pending-cancelled", id: "edge-check-pending-cancelled-return-invalid", to: "return-invalid-transition" },
      { from: "check-current-preparing", id: "edge-check-current-preparing-check-preparing-ready", to: "check-preparing-ready" },
      { from: "check-current-preparing", id: "edge-check-current-preparing-check-current-ready", to: "check-current-ready" },
      { from: "check-preparing-ready", id: "edge-check-preparing-ready-update-order", to: "update-order" },
      { from: "check-preparing-ready", id: "edge-check-preparing-ready-check-preparing-cancelled", to: "check-preparing-cancelled" },
      { from: "check-preparing-cancelled", id: "edge-check-preparing-cancelled-update-order", to: "update-order" },
      { from: "check-preparing-cancelled", id: "edge-check-preparing-cancelled-return-invalid", to: "return-invalid-transition" },
      { from: "check-current-ready", id: "edge-check-current-ready-check-ready-completed", to: "check-ready-completed" },
      { from: "check-current-ready", id: "edge-check-current-ready-return-invalid", to: "return-invalid-transition" },
      { from: "check-ready-completed", id: "edge-check-ready-completed-update-order", to: "update-order" },
      { from: "check-ready-completed", id: "edge-check-ready-completed-return-invalid", to: "return-invalid-transition" },
      { from: "update-order", id: "edge-update-order-return-updated", to: "return-updated" },
    ],
    nodes: [
      { config: {}, id: "start", type: "routeTrigger" },
      {
        config: { fields: { orderId: { required: true, type: "string" } } },
        id: "validate-order-id",
        type: "validateBody",
      },
      {
        config: {
          fields: {
            status: {
              enum: ["preparing", "ready", "completed", "cancelled"],
              required: true,
              type: "string",
            },
          },
        },
        id: "validate-status",
        type: "validateBody",
      },
      { config: { entryId: "{{body.orderId}}" }, id: "get-order", type: "getEntry" },
      orderBranch("check-current-pending", "{{steps.get-order.entry.data.status}}", "pending", "check-pending-preparing", "check-current-preparing"),
      orderBranch("check-pending-preparing", "{{body.status}}", "preparing", "update-order", "check-pending-cancelled"),
      orderBranch("check-pending-cancelled", "{{body.status}}", "cancelled", "update-order", "return-invalid-transition"),
      orderBranch("check-current-preparing", "{{steps.get-order.entry.data.status}}", "preparing", "check-preparing-ready", "check-current-ready"),
      orderBranch("check-preparing-ready", "{{body.status}}", "ready", "update-order", "check-preparing-cancelled"),
      orderBranch("check-preparing-cancelled", "{{body.status}}", "cancelled", "update-order", "return-invalid-transition"),
      orderBranch("check-current-ready", "{{steps.get-order.entry.data.status}}", "ready", "check-ready-completed", "return-invalid-transition"),
      orderBranch("check-ready-completed", "{{body.status}}", "completed", "update-order", "return-invalid-transition"),
      { config: { data: { status: "{{body.status}}" }, entryId: "{{body.orderId}}" }, id: "update-order", type: "updateEntry" },
      {
        config: { body: { ok: true, order: "{{steps.update-order.entry}}", status: "{{body.status}}" }, status: 200 },
        id: "return-updated",
        type: "returnResponse",
      },
      {
        config: {
          body: {
            currentStatus: "{{steps.get-order.entry.data.status}}",
            error: "ORDER_STATUS_TRANSITION_INVALID",
            ok: false,
            requestedStatus: "{{body.status}}",
          },
          status: 409,
        },
        id: "return-invalid-transition",
        type: "returnResponse",
      },
    ],
    route: { method: "POST", path: "/orders/status" },
    startNodeId: "start",
    version: 1,
  };
}

function orderBranch(id: string, left: string, right: string, thenNodeId: string, elseNodeId: string) {
  return {
    config: { condition: { left, operator: "eq", right }, elseNodeId, thenNodeId },
    id,
    type: "branch",
  };
}

function reportWorkflowDefinition() {
  return {
    edges: [
      { from: "start", id: "edge-start-query-orders", to: "query-orders" },
      { from: "query-orders", id: "edge-query-orders-return-report", to: "return-report" },
    ],
    nodes: [
      { config: {}, id: "start", type: "routeTrigger" },
      { config: { limit: 50, offset: 0, schema: "orders" }, id: "query-orders", type: "queryEntries" },
      {
        config: {
          body: {
            entries: "{{steps.query-orders.entries}}",
            limit: "{{steps.query-orders.limit}}",
            ok: true,
            offset: "{{steps.query-orders.offset}}",
            total: "{{steps.query-orders.total}}",
          },
          status: 200,
        },
        id: "return-report",
        type: "returnResponse",
      },
    ],
    route: { method: "GET", path: "/reports/orders" },
    startNodeId: "start",
    version: 1,
  };
}
