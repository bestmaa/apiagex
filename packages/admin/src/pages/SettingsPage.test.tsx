// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createAutomationToken,
  createWorkflow,
  exportProjectTemplate,
  importProjectTemplate,
  listAutomationTokens,
  listSchemas,
  listWorkflowRuns,
  listWorkflows,
  revokeAutomationToken,
  testWorkflow,
  updateWorkflow,
} from "../api";
import { SettingsPage } from "./SettingsPage";

vi.mock("../api", () => ({
  createAutomationToken: vi.fn(),
  createWorkflow: vi.fn(),
  exportProjectTemplate: vi.fn(),
  importProjectTemplate: vi.fn(),
  listAutomationTokens: vi.fn(),
  listSchemas: vi.fn(),
  listWorkflowRuns: vi.fn(),
  listWorkflows: vi.fn(),
  revokeAutomationToken: vi.fn(),
  testWorkflow: vi.fn(),
  updateWorkflow: vi.fn(),
}));

const roots: Array<{ container: HTMLDivElement; root: Root }> = [];

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.mocked(listSchemas).mockResolvedValue({ ok: true, schemas: [] });
    vi.mocked(listAutomationTokens).mockResolvedValue({ ok: true, tokens: [] });
    vi.mocked(listWorkflowRuns).mockResolvedValue({ ok: true, runs: [] });
    vi.mocked(listWorkflows).mockResolvedValue({ ok: true, workflows: [] });
    vi.mocked(createAutomationToken).mockResolvedValue({ ok: true, token: "agx_auto_secret" });
    vi.mocked(exportProjectTemplate).mockResolvedValue({
      ok: true,
      template: {
        exportedAt: "2026-05-22T00:00:00.000Z",
        kind: "apiagex.project-template",
        tables: {},
        version: 1,
      },
    });
    vi.mocked(importProjectTemplate).mockResolvedValue({ ok: true, imported: {}, skipped: {} });
    vi.mocked(revokeAutomationToken).mockResolvedValue({ ok: true });
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
