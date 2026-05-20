// @vitest-environment jsdom
import { act, createElement, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createWorkflow, listSchemas, listWorkflowRuns, listWorkflows, testWorkflow, updateWorkflow } from "./api";
import { WorkflowManager } from "./WorkflowManager";
import type { SchemaRecord } from "./schema.type";
import type { WorkflowRecord } from "./workflow.type";

vi.mock("./api", () => ({
  createWorkflow: vi.fn(),
  listSchemas: vi.fn(),
  listWorkflowRuns: vi.fn(),
  listWorkflows: vi.fn(),
  testWorkflow: vi.fn(),
  updateWorkflow: vi.fn(),
}));

vi.mock("@xyflow/react", () => ({
  addEdge: (connection: Record<string, unknown>, edges: Array<Record<string, unknown>>) => [...edges, connection],
  Background: () => createElement("div", { "data-testid": "graph-background" }),
  Controls: () => createElement("div", { "data-testid": "graph-controls" }),
  Handle: () => createElement("span", { "data-testid": "graph-handle" }),
  MiniMap: () => createElement("div", { "data-testid": "graph-minimap" }),
  Position: {
    Left: "left",
    Right: "right",
  },
  ReactFlow: ({
    children,
    edges,
    nodes,
    nodeTypes,
  }: {
    children: unknown;
    edges: Array<{ id: string; label?: string }>;
    nodes: Array<{ data: { configSummary: string; label: string; stateText: string }; id: string; type?: string }>;
    nodeTypes?: Record<string, (props: { data: { configSummary: string; label: string; stateText: string }; selected: boolean }) => unknown>;
  }) => createElement(
    "div",
    { "data-edge-count": edges.length, "data-node-count": nodes.length, "data-testid": "react-flow" },
    edges.map((edge) => edge.label ? createElement("span", { key: edge.id }, edge.label) : null),
    nodes.map((node, index) => {
      const NodeComponent = node.type ? nodeTypes?.[node.type] : undefined;
      if (NodeComponent) {
        return createElement(NodeComponent, { data: node.data, key: node.id, selected: index === 0 });
      }
      return createElement("div", { key: node.data.label }, node.data.label, node.data.configSummary, node.data.stateText);
    }),
    children,
  ),
  useEdgesState: (initialEdges: Array<Record<string, unknown>>) => {
    const [edges, setEdges] = useState(initialEdges);
    return [edges, setEdges, vi.fn()];
  },
  useNodesState: (initialNodes: Array<Record<string, unknown>>) => {
    const [nodes, setNodes] = useState(initialNodes);
    return [nodes, setNodes, vi.fn()];
  },
}));

const roots: Array<{ container: HTMLDivElement; root: Root }> = [];

describe("WorkflowManager", () => {
  beforeEach(() => {
    vi.mocked(listSchemas).mockResolvedValue({ ok: true, schemas: [schema()] });
    vi.mocked(listWorkflowRuns).mockResolvedValue({
      ok: true,
      runs: [
        {
          createdAt: "2026-05-20T10:00:00.000Z",
          durationMs: 23,
          errorCode: null,
          id: "run_1",
          request: {
            headers: { authorization: "[redacted]", "x-request-id": "req_123" },
            method: "POST",
            params: { id: "1" },
            path: "/api/custom/echo",
            query: { debug: true },
          },
          status: "success",
          statusCode: 201,
          workflowId: "workflow_pay",
        },
      ],
    });
    vi.mocked(listWorkflows).mockResolvedValue({ ok: true, workflows: [workflow(), workflow({ active: false, name: "Archive order", path: "/orders/archive" })] });
    vi.mocked(testWorkflow).mockResolvedValue({
      ok: true,
      result: {
        error: null,
        executedNodeIds: ["start", "return-echo"],
        ok: true,
        response: { body: { ok: true }, headers: {}, status: 200 },
        steps: { "return-echo": { body: { ok: true } }, start: { body: { message: "hello" } } },
      },
    });
    vi.mocked(createWorkflow).mockResolvedValue({ ok: true, workflow: workflow({ id: "workflow_created", name: "Created workflow", path: "/created" }) });
    vi.mocked(updateWorkflow).mockResolvedValue({ ok: true, workflow: workflow({ id: "workflow_pay", name: "Pay order updated", path: "/orders/pay-now" }) });
  });

  afterEach(() => {
    for (const { container, root } of roots.splice(0)) {
      root.unmount();
      container.remove();
    }
    vi.clearAllMocks();
  });

  it("shows loading and then renders workflow rows", async () => {
    const deferred = createDeferred<Awaited<ReturnType<typeof listWorkflows>>>();
    vi.mocked(listWorkflows).mockReturnValue(deferred.promise);
    const { container } = renderWorkflowManager();

    expect(container.textContent).toContain("Loading workflows");

    await act(async () => {
      deferred.resolve({ ok: true, workflows: [workflow()] });
      await flushPromises();
    });

    expect(container.textContent).toContain("Pay order");
    expect(container.textContent).toContain("POST");
    expect(container.textContent).toContain("/api/custom/orders/pay");
    expect(container.textContent).toContain("Active");
    expect(container.textContent).toContain("Needs Custom API permission");
  });

  it("supports search and active/inactive filters", async () => {
    const { container } = await renderWorkflowManagerLoaded();
    const search = container.querySelector<HTMLInputElement>("input[type='search']");
    const select = container.querySelector<HTMLSelectElement>("select");
    if (!search || !select) throw new Error("WORKFLOW_FILTER_CONTROLS_MISSING");

    await act(async () => {
      setInputValue(search, "archive");
      search.dispatchEvent(new Event("input", { bubbles: true }));
      await flushPromises();
    });
    expect(container.textContent).toContain("Archive order");
    expect(container.textContent).not.toContain("Pay order");

    await act(async () => {
      setInputValue(search, "");
      search.dispatchEvent(new Event("input", { bubbles: true }));
      select.value = "active";
      select.dispatchEvent(new Event("change", { bubbles: true }));
      await flushPromises();
    });
    expect(container.textContent).toContain("Pay order");
    expect(container.textContent).not.toContain("Archive order");
  });

  it("renders a read-only graph view for workflow definitions", async () => {
    vi.mocked(listWorkflows).mockResolvedValueOnce({
      ok: true,
      workflows: [workflow({
        definition: {
          edges: [{ from: "start", id: "edge-start-return-ok", to: "return-ok" }],
          nodes: [
            { config: {}, id: "start", type: "routeTrigger" },
            { config: { body: { ok: true }, status: 200 }, id: "return-ok", type: "returnResponse" },
          ],
          route: { method: "POST", path: "/orders/pay" },
          startNodeId: "start",
          version: 1,
        },
      })],
    });
    const { container } = await renderWorkflowManagerLoaded();

    await act(async () => {
      clickButton(container, "Graph");
      await flushPromises();
    });

    expect(container.textContent).toContain("Graph editor");
    expect(container.textContent).toContain("Select nodes, edit config, connect edges, then save.");
    expect(container.textContent).toContain("Route trigger");
    expect(container.textContent).toContain("Return response");
    expect(container.textContent).toContain("Ready");
    expect(container.textContent).toContain("status: 200");
    const graph = container.querySelector<HTMLElement>("[data-testid='react-flow']");
    expect(graph?.dataset.nodeCount).toBe("2");
    expect(graph?.dataset.edgeCount).toBe("1");
  });

  it("saves graph node config edits through the workflow API", async () => {
    vi.mocked(listWorkflows).mockResolvedValueOnce({
      ok: true,
      workflows: [workflow({
        definition: {
          edges: [{ from: "start", id: "edge-start-return-ok", to: "return-ok" }],
          nodes: [
            { config: {}, id: "start", type: "routeTrigger" },
            { config: { body: { ok: true }, status: 200 }, id: "return-ok", type: "returnResponse" },
          ],
          route: { method: "POST", path: "/orders/pay" },
          startNodeId: "start",
          version: 1,
        },
      })],
    });
    const { container } = await renderWorkflowManagerLoaded();

    await act(async () => {
      clickButton(container, "Graph");
      await flushPromises();
    });
    const config = container.querySelector<HTMLTextAreaElement>(".workflow-graph-inspector textarea");
    if (!config) throw new Error("GRAPH_CONFIG_TEXTAREA_MISSING");

    await act(async () => {
      setTextAreaValue(config, JSON.stringify({ audit: true }, null, 2));
      clickButton(container, "Apply config");
      await flushPromises();
    });
    await act(async () => {
      clickButton(container, "Save graph");
      await flushPromises();
    });

    expect(updateWorkflow).toHaveBeenCalledWith("workflow_pay", expect.objectContaining({
      definition: expect.objectContaining({
        nodes: expect.arrayContaining([
          expect.objectContaining({
            config: { audit: true },
            id: "start",
            type: "routeTrigger",
          }),
        ]),
      }),
    }));
    expect(container.textContent).toContain("Saved graph for Pay order updated");
  });

  it("blocks saving invalid graph edits", async () => {
    const { container } = await renderWorkflowManagerLoaded();

    await act(async () => {
      clickButton(container, "Graph");
      await flushPromises();
    });
    await act(async () => {
      setSelectValue(selectByLabel(container, "Add node"), "queryEntries");
      await flushPromises();
    });
    await act(async () => {
      clickButton(container, "Save graph");
      await flushPromises();
    });

    expect(container.textContent).toContain("Graph save blocked");
    expect(container.textContent).toContain("Schema missing");
    expect(updateWorkflow).not.toHaveBeenCalled();
  });

  it("shows duplicate graph path validation on edges", async () => {
    vi.mocked(listWorkflows).mockResolvedValueOnce({
      ok: true,
      workflows: [workflow({
        definition: {
          edges: [
            { from: "start", id: "edge-start-return-one", to: "return-one" },
            { from: "start", id: "edge-start-return-two", to: "return-two" },
          ],
          nodes: [
            { config: {}, id: "start", type: "routeTrigger" },
            { config: { body: { ok: true }, status: 200 }, id: "return-one", type: "returnResponse" },
            { config: { body: { ok: true }, status: 200 }, id: "return-two", type: "returnResponse" },
          ],
          route: { method: "POST", path: "/orders/pay" },
          startNodeId: "start",
          version: 1,
        },
      })],
    });
    const { container } = await renderWorkflowManagerLoaded();

    await act(async () => {
      clickButton(container, "Graph");
      await flushPromises();
    });

    expect(container.textContent).toContain("duplicate outgoing path from start");
  });

  it("saves auto-layout positions without changing graph semantics", async () => {
    vi.mocked(listWorkflows).mockResolvedValueOnce({
      ok: true,
      workflows: [workflow({
        definition: {
          edges: [{ from: "start", id: "edge-start-return-ok", to: "return-ok" }],
          nodes: [
            { config: {}, id: "start", position: { x: 900, y: 900 }, type: "routeTrigger" },
            { config: { body: { ok: true }, status: 200 }, id: "return-ok", position: { x: 10, y: 10 }, type: "returnResponse" },
          ],
          route: { method: "POST", path: "/orders/pay" },
          startNodeId: "start",
          version: 1,
        },
      })],
    });
    const { container } = await renderWorkflowManagerLoaded();

    await act(async () => {
      clickButton(container, "Graph");
      await flushPromises();
    });
    await act(async () => {
      clickButton(container, "Auto-layout");
      await flushPromises();
    });
    await act(async () => {
      clickButton(container, "Save graph");
      await flushPromises();
    });

    expect(updateWorkflow).toHaveBeenCalledWith("workflow_pay", expect.objectContaining({
      definition: expect.objectContaining({
        edges: [{ from: "start", id: "edge-start-return-ok", to: "return-ok" }],
        nodes: expect.arrayContaining([
          expect.objectContaining({ id: "start", position: { x: 64, y: 96 } }),
          expect.objectContaining({ id: "return-ok", position: { x: 324, y: 96 } }),
        ]),
      }),
    }));
  });

  it("explains activation behavior in the workflow form", async () => {
    const { container } = await renderWorkflowManagerLoaded();

    await act(async () => {
      clickButton(container, "Create workflow");
      await flushPromises();
    });
    expect(container.textContent).toContain("Route is kept private while inactive");
    expect(container.textContent).toContain("returns 404");

    const active = [...container.querySelectorAll<HTMLInputElement>("input[type='checkbox']")]
      .find((input) => input.closest("label")?.textContent?.includes("Active"));
    if (!active) throw new Error("ACTIVE_CHECKBOX_NOT_FOUND");
    await act(async () => {
      active.click();
      await flushPromises();
    });

    expect(container.textContent).toContain("Route will be callable after permission allow");
    expect(container.textContent).toContain("Custom API Permissions");
  });

  it("shows empty and error states", async () => {
    vi.mocked(listWorkflows).mockResolvedValueOnce({ ok: true, workflows: [] });
    const empty = await renderWorkflowManagerLoaded();
    expect(empty.container.textContent).toContain("No workflows yet");
    empty.root.unmount();
    empty.container.remove();
    roots.pop();

    vi.mocked(listWorkflows).mockResolvedValueOnce({ ok: false, error: "Workflow list failed" });
    const error = await renderWorkflowManagerLoaded();
    expect(error.container.textContent).toContain("Workflow list failed");
  });

  it("creates a workflow with a placeholder return definition", async () => {
    const { container } = await renderWorkflowManagerLoaded();

    await act(async () => {
      clickButton(container, "Create workflow");
      await flushPromises();
    });
    setInputValue(inputByPlaceholder(container, "Pay order"), "Created workflow");
    setInputValue(inputByPlaceholder(container, "/orders/pay"), "created");
    setTextAreaValue(textareaByPlaceholder(container, "Payment workflow"), "Created from UI");
    await act(async () => {
      clickButton(container, "Save workflow");
      await flushPromises();
    });

    expect(createWorkflow).toHaveBeenCalledWith(expect.objectContaining({
      active: false,
      description: "Created from UI",
      method: "POST",
      name: "Created workflow",
      path: "/created",
      version: 1,
    }));
    expect(vi.mocked(createWorkflow).mock.calls[0]?.[0].definition).toMatchObject({
      nodes: [
        { id: "start", type: "routeTrigger" },
        { type: "returnResponse" },
      ],
      route: { method: "POST", path: "/created" },
      startNodeId: "start",
    });
    expect(container.textContent).toContain("Created workflow");
  });

  it("creates the register user template without storing plain passwords", async () => {
    vi.mocked(createWorkflow).mockResolvedValueOnce({
      ok: true,
      workflow: workflow({ id: "workflow_register", name: "Register user template", path: "/auth/register" }),
    });
    const { container } = await renderWorkflowManagerLoaded();

    await act(async () => {
      clickButton(container, "Create register template");
      await flushPromises();
    });

    const draft = vi.mocked(createWorkflow).mock.calls[0]?.[0];
    expect(draft).toMatchObject({
      active: false,
      method: "POST",
      name: "Register user template",
      path: "/auth/register",
    });
    expect(draft?.description).toContain("Replace the placeholder password hashing");
    expect(draft?.definition).toEqual(expect.objectContaining({
      edges: expect.arrayContaining([
        expect.objectContaining({ from: "duplicate-branch", to: "return-user-exists" }),
        expect.objectContaining({ from: "duplicate-branch", to: "create-inactive-user" }),
      ]),
      nodes: expect.arrayContaining([
        expect.objectContaining({
          config: {
            fields: {
              email: { required: true, type: "email" },
            },
          },
          id: "validate-email",
          type: "validateBody",
        }),
        expect.objectContaining({
          config: {
            fields: {
              password: { minLength: 8, required: true, type: "string" },
            },
          },
          id: "validate-password",
          type: "validateBody",
        }),
        expect.objectContaining({
          config: {
            filters: [{ field: "email", operator: "eq", value: "{{body.email}}" }],
            limit: 1,
            schema: "users",
          },
          id: "check-existing-user",
          type: "queryEntries",
        }),
        expect.objectContaining({
          config: {
            data: {
              email: "{{body.email}}",
              passwordHash: "PASSWORD_HASH_PLACEHOLDER_REPLACE_WITH_SERVER_SIDE_HASHING",
              status: "inactive",
            },
            schema: "users",
          },
          id: "create-inactive-user",
          type: "createEntry",
        }),
      ]),
    }));
    expect(JSON.stringify(draft?.definition)).not.toContain("{{body.password}}");
    expect(container.textContent).toContain("Created register user template");
  });

  it("creates the order status template with transition guards", async () => {
    vi.mocked(createWorkflow).mockResolvedValueOnce({
      ok: true,
      workflow: workflow({ id: "workflow_order_status", name: "Order status template", path: "/orders/status" }),
    });
    const { container } = await renderWorkflowManagerLoaded();

    await act(async () => {
      clickButton(container, "Create order status template");
      await flushPromises();
    });

    const draft = vi.mocked(createWorkflow).mock.calls[0]?.[0];
    expect(draft).toMatchObject({
      active: false,
      method: "POST",
      name: "Order status template",
      path: "/orders/status",
    });
    expect(draft?.description).toContain("pending->preparing");
    expect(draft?.definition).toEqual(expect.objectContaining({
      edges: expect.arrayContaining([
        expect.objectContaining({ from: "check-pending-preparing", to: "update-order" }),
        expect.objectContaining({ from: "check-ready-completed", to: "return-invalid-transition" }),
      ]),
      nodes: expect.arrayContaining([
        expect.objectContaining({
          config: { entryId: "{{body.orderId}}" },
          id: "get-order",
          type: "getEntry",
        }),
        expect.objectContaining({
          config: {
            condition: {
              left: "{{steps.get-order.entry.data.status}}",
              operator: "eq",
              right: "pending",
            },
            elseNodeId: "check-current-preparing",
            thenNodeId: "check-pending-preparing",
          },
          id: "check-current-pending",
          type: "branch",
        }),
        expect.objectContaining({
          config: {
            data: { status: "{{body.status}}" },
            entryId: "{{body.orderId}}",
          },
          id: "update-order",
          type: "updateEntry",
        }),
        expect.objectContaining({
          config: {
            body: expect.objectContaining({ error: "ORDER_STATUS_TRANSITION_INVALID" }),
            status: 409,
          },
          id: "return-invalid-transition",
          type: "returnResponse",
        }),
      ]),
    }));
    expect(container.textContent).toContain("Created order status template");
  });

  it("creates the read-only report template with a bounded query", async () => {
    vi.mocked(createWorkflow).mockResolvedValueOnce({
      ok: true,
      workflow: workflow({ id: "workflow_report", method: "GET", name: "Orders report template", path: "/reports/orders" }),
    });
    const { container } = await renderWorkflowManagerLoaded();

    await act(async () => {
      clickButton(container, "Create report template");
      await flushPromises();
    });

    const draft = vi.mocked(createWorkflow).mock.calls[0]?.[0];
    expect(draft).toMatchObject({
      active: false,
      method: "GET",
      name: "Orders report template",
      path: "/reports/orders",
    });
    expect(draft?.definition).toEqual(expect.objectContaining({
      nodes: expect.arrayContaining([
        expect.objectContaining({
          config: { limit: 50, offset: 0, schema: "orders" },
          id: "query-orders",
          type: "queryEntries",
        }),
        expect.objectContaining({
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
        }),
      ]),
    }));
    expect(JSON.stringify(draft?.definition)).not.toContain("createEntry");
    expect(JSON.stringify(draft?.definition)).not.toContain("updateEntry");
    expect(container.textContent).toContain("Created report template");
  });

  it("creates a workflow with ordered query and return steps", async () => {
    const { container } = await renderWorkflowManagerLoaded();

    await act(async () => {
      clickButton(container, "Create workflow");
      await flushPromises();
    });
    setInputValue(inputByPlaceholder(container, "Pay order"), "Lookup products");
    setInputValue(inputByPlaceholder(container, "/orders/pay"), "/products/lookup");
    await addWorkflowStep(container, "queryEntries");
    setInputValue(inputByPlaceholder(container, "orders"), "products");
    setInputValue(inputByPlaceholder(container, "{{body.email}}"), "phone");

    await act(async () => {
      clickButton(container, "Save workflow");
      await flushPromises();
    });

    const draft = vi.mocked(createWorkflow).mock.calls[0]?.[0];
    expect(draft?.definition).toMatchObject({
      edges: [
        { from: "start" },
        { to: expect.stringContaining("return") },
      ],
      nodes: [
        { id: "start", type: "routeTrigger" },
        { config: { limit: 20, schema: "products", search: "phone" }, type: "queryEntries" },
        { config: { body: { ok: true }, status: 200 }, type: "returnResponse" },
      ],
      route: { method: "POST", path: "/products/lookup" },
      startNodeId: "start",
    });
  });

  it("creates a workflow with an HTTP request step", async () => {
    const { container } = await renderWorkflowManagerLoaded();

    await act(async () => {
      clickButton(container, "Create workflow");
      await flushPromises();
    });
    setInputValue(inputByPlaceholder(container, "Pay order"), "Send provider request");
    setInputValue(inputByPlaceholder(container, "/orders/pay"), "/provider/send");
    await addWorkflowStep(container, "httpRequest");
    setInputValue(inputByPlaceholder(container, "https://api.provider.test/messages"), "https://api.provider.test/messages");
    setInputValue(inputByPlaceholder(container, "providerResult"), "provider");

    await act(async () => {
      clickButton(container, "Save workflow");
      await flushPromises();
    });

    expect(vi.mocked(createWorkflow).mock.calls[0]?.[0].definition).toMatchObject({
      nodes: [
        { id: "start", type: "routeTrigger" },
        {
          config: {
            method: "POST",
            outputKey: "provider",
            responseBodyMode: "json",
            successStatus: [200, 201, 202],
            timeoutMs: 5000,
            url: "https://api.provider.test/messages",
          },
          type: "httpRequest",
        },
        { type: "returnResponse" },
      ],
    });
  });

  it("uses schema and field pickers without hiding the slug inputs", async () => {
    const { container } = await renderWorkflowManagerLoaded();

    await act(async () => {
      clickButton(container, "Create workflow");
      await flushPromises();
    });
    setInputValue(inputByPlaceholder(container, "Pay order"), "Create product");
    setInputValue(inputByPlaceholder(container, "/orders/pay"), "/products/create");
    await addWorkflowStep(container, "createEntry");
    setSelectValue(selectByLabel(container, "Pick schema"), "products");
    setSelectValue(selectByLabel(container, "Add data field"), "title");

    expect(inputByDisplayValue(container, "products")).toBeTruthy();
    expect(textareaWithValue(container, "{{body.title}}")).toBeTruthy();

    await act(async () => {
      clickButton(container, "Save workflow");
      await flushPromises();
    });

    expect(vi.mocked(createWorkflow).mock.calls[0]?.[0].definition).toMatchObject({
      nodes: [
        { id: "start", type: "routeTrigger" },
        { config: { data: { title: "{{body.title}}" }, schema: "products" }, type: "createEntry" },
        { type: "returnResponse" },
      ],
    });
  });

  it("supports adding, reordering, and removing workflow steps", async () => {
    const { container } = await renderWorkflowManagerLoaded();

    await act(async () => {
      clickButton(container, "Create workflow");
      await flushPromises();
    });
    await addWorkflowStep(container, "queryEntries");
    await addWorkflowStep(container, "createEntry");
    expect(container.textContent).toContain("3 ordered steps");
    expect(stepLegends(container)).toEqual(["1. Query entries", "2. Create entry", "3. Return response"]);

    await act(async () => {
      clickButton(container, "Move down");
      await flushPromises();
    });
    expect(stepLegends(container)).toEqual(["1. Create entry", "2. Query entries", "3. Return response"]);

    await act(async () => {
      clickButton(container, "Remove");
      await flushPromises();
    });
    expect(container.textContent).toContain("2 ordered steps");
    expect(stepLegends(container)).toEqual(["1. Query entries", "2. Return response"]);
  });

  it("does not save invalid workflow step config", async () => {
    const { container } = await renderWorkflowManagerLoaded();

    await act(async () => {
      clickButton(container, "Create workflow");
      await flushPromises();
    });
    setInputValue(inputByPlaceholder(container, "Pay order"), "Invalid lookup");
    setInputValue(inputByPlaceholder(container, "/orders/pay"), "/invalid-lookup");
    await addWorkflowStep(container, "queryEntries");
    await act(async () => {
      clickButton(container, "Save workflow");
      await flushPromises();
    });

    expect(createWorkflow).not.toHaveBeenCalled();
    expect(container.textContent).toContain("Invalid workflow: step 1 needs a schema slug.");
  });

  it("edits workflow basics without executing the workflow", async () => {
    const { container } = await renderWorkflowManagerLoaded();

    await act(async () => {
      clickButton(container, "Edit");
      await flushPromises();
    });
    setInputValue(inputByDisplayValue(container, "Pay order"), "Pay order updated");
    setInputValue(inputByDisplayValue(container, "/orders/pay"), "/orders/pay-now");
    await act(async () => {
      clickButton(container, "Save workflow");
      await flushPromises();
    });

    expect(updateWorkflow).toHaveBeenCalledWith("workflow_pay", expect.objectContaining({
      name: "Pay order updated",
      path: "/orders/pay-now",
    }));
    expect(createWorkflow).not.toHaveBeenCalled();
    expect(container.textContent).toContain("Pay order updated");
  });

  it("runs a workflow test from the edit panel", async () => {
    const { container } = await renderWorkflowManagerLoaded();

    await act(async () => {
      clickButton(container, "Edit");
      await flushPromises();
    });
    await act(async () => {
      clickButton(container, "Run test");
      await flushPromises();
    });

    expect(testWorkflow).toHaveBeenCalledWith("workflow_pay", {
      body: { message: "hello" },
      headers: {},
      params: {},
      query: {},
    });
    expect(container.textContent).toContain("Workflow test passed");
    expect(container.textContent).toContain("Step outputs");
    expect(container.textContent).toContain("return-echo");
  });

  it("shows workflow run history in the edit panel", async () => {
    const { container } = await renderWorkflowManagerLoaded();

    await act(async () => {
      clickButton(container, "Edit");
      await flushPromises();
    });

    expect(listWorkflowRuns).toHaveBeenCalledWith("workflow_pay", 20);
    expect(container.textContent).toContain("Run history");
    expect(container.textContent).toContain("/api/custom/echo");
    expect(container.textContent).toContain("23 ms");
    expect(container.textContent).toContain("none");
    expect(container.textContent).toContain("[redacted]");
    expect(container.textContent).not.toContain("Bearer secret");
  });
});

function renderWorkflowManager(): { container: HTMLDivElement; root: Root } {
  const container = document.createElement("div");
  const root = createRoot(container);
  roots.push({ container, root });
  document.body.appendChild(container);
  act(() => {
    root.render(<WorkflowManager />);
  });
  return { container, root };
}

async function renderWorkflowManagerLoaded(): Promise<{ container: HTMLDivElement; root: Root }> {
  const rendered = renderWorkflowManager();
  await act(async () => {
    await flushPromises();
  });
  return rendered;
}

function workflow(overrides: Partial<WorkflowRecord> = {}): WorkflowRecord {
  return {
    active: true,
    createdAt: "2026-05-20T08:00:00.000Z",
    createdBy: null,
    definition: {},
    description: "Workflow description",
    id: `workflow_${overrides.name ?? "pay"}`,
    lastRunAt: null,
    method: "POST",
    name: "Pay order",
    path: "/orders/pay",
    updatedAt: "2026-05-20T09:00:00.000Z",
    updatedBy: null,
    version: 1,
    ...overrides,
  };
}

function schema(overrides: Partial<SchemaRecord> = {}): SchemaRecord {
  return {
    description: "Product catalog",
    fields: [
      { name: "Title", required: true, slug: "title", type: "text" },
      { name: "Price", required: false, slug: "price", type: "number" },
    ],
    id: "schema_products",
    name: "Products",
    slug: "products",
    ...overrides,
  };
}

function createDeferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

function setInputValue(input: HTMLInputElement, value: string): void {
  const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  valueSetter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function setTextAreaValue(textarea: HTMLTextAreaElement, value: string): void {
  const valueSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
  valueSetter?.call(textarea, value);
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

function setSelectValue(select: HTMLSelectElement, value: string): void {
  const valueSetter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set;
  valueSetter?.call(select, value);
  select.dispatchEvent(new Event("change", { bubbles: true }));
}

function clickButton(container: HTMLDivElement, name: string): void {
  const button = [...container.querySelectorAll("button")].find((item) => item.textContent?.includes(name));
  if (!button) throw new Error(`BUTTON_NOT_FOUND_${name}`);
  button.click();
}

async function addWorkflowStep(container: HTMLDivElement, type: string): Promise<void> {
  const select = selectByLabel(container, "Add step");
  await act(async () => {
    setSelectValue(select, type);
    await flushPromises();
  });
}

function inputByPlaceholder(container: HTMLDivElement, placeholder: string): HTMLInputElement {
  const input = container.querySelector<HTMLInputElement>(`input[placeholder="${placeholder}"]`);
  if (!input) throw new Error(`INPUT_NOT_FOUND_${placeholder}`);
  return input;
}

function textareaByPlaceholder(container: HTMLDivElement, placeholder: string): HTMLTextAreaElement {
  const textarea = container.querySelector<HTMLTextAreaElement>(`textarea[placeholder="${placeholder}"]`);
  if (!textarea) throw new Error(`TEXTAREA_NOT_FOUND_${placeholder}`);
  return textarea;
}

function inputByDisplayValue(container: HTMLDivElement, value: string): HTMLInputElement {
  const input = [...container.querySelectorAll<HTMLInputElement>("input")].find((item) => item.value === value);
  if (!input) throw new Error(`INPUT_VALUE_NOT_FOUND_${value}`);
  return input;
}

function textareaWithValue(container: HTMLDivElement, value: string): HTMLTextAreaElement {
  const textarea = [...container.querySelectorAll<HTMLTextAreaElement>("textarea")].find((item) => item.value.includes(value));
  if (!textarea) throw new Error(`TEXTAREA_VALUE_NOT_FOUND_${value}`);
  return textarea;
}

function selectByLabel(container: HTMLDivElement, labelName: string): HTMLSelectElement {
  const label = [...container.querySelectorAll("label")].find((item) => item.textContent?.includes(labelName));
  const select = label?.querySelector("select");
  if (!select) throw new Error(`SELECT_NOT_FOUND_${labelName}`);
  return select;
}

function stepLegends(container: HTMLDivElement): string[] {
  return [...container.querySelectorAll(".workflow-step-card legend")]
    .map((legend) => legend.textContent ?? "");
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
