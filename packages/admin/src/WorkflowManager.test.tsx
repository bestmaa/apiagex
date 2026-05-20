// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createWorkflow, listWorkflows, updateWorkflow } from "./api";
import { WorkflowManager } from "./WorkflowManager";
import type { WorkflowRecord } from "./workflow.type";

vi.mock("./api", () => ({
  createWorkflow: vi.fn(),
  listWorkflows: vi.fn(),
  updateWorkflow: vi.fn(),
}));

const roots: Array<{ container: HTMLDivElement; root: Root }> = [];

describe("WorkflowManager", () => {
  beforeEach(() => {
    vi.mocked(listWorkflows).mockResolvedValue({ ok: true, workflows: [workflow(), workflow({ active: false, name: "Archive order", path: "/orders/archive" })] });
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
      route: { method: "POST", path: "/created" },
      startNodeId: "start",
    });
    expect(container.textContent).toContain("Created workflow");
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

function clickButton(container: HTMLDivElement, name: string): void {
  const button = [...container.querySelectorAll("button")].find((item) => item.textContent?.includes(name));
  if (!button) throw new Error(`BUTTON_NOT_FOUND_${name}`);
  button.click();
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

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
