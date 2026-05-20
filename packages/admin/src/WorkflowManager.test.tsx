// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { listWorkflows } from "./api";
import { WorkflowManager } from "./WorkflowManager";
import type { WorkflowRecord } from "./workflow.type";

vi.mock("./api", () => ({
  listWorkflows: vi.fn(),
}));

const roots: Array<{ container: HTMLDivElement; root: Root }> = [];

describe("WorkflowManager", () => {
  beforeEach(() => {
    vi.mocked(listWorkflows).mockResolvedValue({ ok: true, workflows: [workflow(), workflow({ active: false, name: "Archive order", path: "/orders/archive" })] });
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
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
