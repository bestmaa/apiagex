// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createWorkflow, listSchemas, listWorkflows, testWorkflow, updateWorkflow } from "../api";
import { SettingsPage } from "./SettingsPage";

vi.mock("../api", () => ({
  createWorkflow: vi.fn(),
  listSchemas: vi.fn(),
  listWorkflows: vi.fn(),
  testWorkflow: vi.fn(),
  updateWorkflow: vi.fn(),
}));

const roots: Array<{ container: HTMLDivElement; root: Root }> = [];

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.mocked(listSchemas).mockResolvedValue({ ok: true, schemas: [] });
    vi.mocked(listWorkflows).mockResolvedValue({ ok: true, workflows: [] });
    vi.mocked(testWorkflow).mockResolvedValue({ ok: true });
    vi.mocked(createWorkflow).mockResolvedValue({ ok: true });
    vi.mocked(updateWorkflow).mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    for (const { container, root } of roots.splice(0)) {
      root.unmount();
      container.remove();
    }
    vi.clearAllMocks();
  });

  it("renders the workflow settings page shell", async () => {
    const container = await renderSettingsPage();

    expect(container.textContent).toContain("Workflows");
    expect(container.textContent).toContain("/api/custom");
    expect(container.textContent).toContain("Workflow list");
  });
});

async function renderSettingsPage(): Promise<HTMLDivElement> {
  const container = document.createElement("div");
  const root = createRoot(container);
  roots.push({ container, root });
  document.body.appendChild(container);
  await act(async () => {
    root.render(<SettingsPage route="settings/workflows" />);
    await flushPromises();
  });
  return container;
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
