// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { SettingsPage } from "./SettingsPage";

const roots: Array<{ container: HTMLDivElement; root: Root }> = [];

describe("SettingsPage", () => {
  afterEach(() => {
    for (const { container, root } of roots.splice(0)) {
      root.unmount();
      container.remove();
    }
  });

  it("renders the workflow settings page shell", async () => {
    const container = await renderSettingsPage();

    expect(container.textContent).toContain("Workflows");
    expect(container.textContent).toContain("/api/custom");
    expect(container.textContent).toContain("No workflow builder yet");
  });
});

async function renderSettingsPage(): Promise<HTMLDivElement> {
  const container = document.createElement("div");
  const root = createRoot(container);
  roots.push({ container, root });
  document.body.appendChild(container);
  await act(async () => {
    root.render(<SettingsPage route="settings/workflows" />);
  });
  return container;
}
