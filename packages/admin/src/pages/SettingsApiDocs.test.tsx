// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getApiDocsSettings, saveApiDocsSettings } from "../api";
import { SettingsApiDocs } from "./SettingsApiDocs";

vi.mock("../api", () => ({
  getApiDocsSettings: vi.fn(),
  saveApiDocsSettings: vi.fn(),
}));

const roots: Array<{ container: HTMLDivElement; root: Root }> = [];

describe("SettingsApiDocs", () => {
  beforeEach(() => {
    vi.mocked(getApiDocsSettings).mockResolvedValue({
      ok: true,
      settings: { enabled: false, updatedAt: null },
    });
    vi.mocked(saveApiDocsSettings).mockResolvedValue({
      ok: true,
      settings: { enabled: true, updatedAt: "2026-05-17T00:00:00.000Z" },
    });
  });

  afterEach(() => {
    for (const { container, root } of roots.splice(0)) {
      root.unmount();
      container.remove();
    }
    vi.clearAllMocks();
  });

  it("loads and saves Swagger visibility", async () => {
    const container = await renderSettingsApiDocs();
    const checkbox = container.querySelector<HTMLInputElement>("input[type='checkbox']");

    expect(container.textContent).toContain("Swagger/OpenAPI visibility");
    expect(checkbox?.checked).toBe(false);

    await act(async () => {
      checkbox?.click();
      await flushPromises();
    });
    await act(async () => {
      container.querySelector<HTMLButtonElement>("button")?.click();
      await flushPromises();
    });

    expect(saveApiDocsSettings).toHaveBeenCalledWith(true);
    expect(container.textContent).toContain("Swagger docs enabled");
  });
});

async function renderSettingsApiDocs(): Promise<HTMLDivElement> {
  const container = document.createElement("div");
  const root = createRoot(container);
  roots.push({ container, root });
  document.body.appendChild(container);
  await act(async () => {
    root.render(<SettingsApiDocs />);
    await flushPromises();
  });
  return container;
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
