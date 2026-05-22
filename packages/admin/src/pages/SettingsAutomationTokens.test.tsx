// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createAutomationToken,
  listAutomationTokens,
  revokeAutomationToken,
} from "../api";
import type { AutomationTokenRecord } from "../automation-token.type";
import { SettingsAutomationTokens } from "./SettingsAutomationTokens";

vi.mock("../api", () => ({
  createAutomationToken: vi.fn(),
  listAutomationTokens: vi.fn(),
  revokeAutomationToken: vi.fn(),
}));

const tokenRecord: AutomationTokenRecord = {
  createdAt: "2026-05-22T00:00:00.000Z",
  createdByEmail: "owner@example.com",
  createdById: "user_owner",
  expiresAt: "2026-05-22T01:00:00.000Z",
  id: "auto_1",
  lastUsedAt: null,
  name: "Codex setup",
  revokedAt: null,
  scopes: ["schemas:manage", "workflows:manage", "permissions:manage", "routes:read", "plans:apply"],
  tokenPrefix: "agx_auto_test",
};

const roots: Array<{ container: HTMLDivElement; root: Root }> = [];

describe("SettingsAutomationTokens", () => {
  beforeEach(() => {
    vi.mocked(listAutomationTokens).mockResolvedValue({ ok: true, tokens: [] });
    vi.mocked(createAutomationToken).mockResolvedValue({
      ok: true,
      token: "agx_auto_secret",
      tokenRecord,
    });
    vi.mocked(revokeAutomationToken).mockResolvedValue({
      ok: true,
      token: { ...tokenRecord, revokedAt: "2026-05-22T00:01:00.000Z" },
    });
  });

  afterEach(() => {
    for (const { container, root } of roots.splice(0)) {
      root.unmount();
      container.remove();
    }
    vi.clearAllMocks();
  });

  it("creates an automation token and shows the secret once", async () => {
    vi.mocked(listAutomationTokens)
      .mockResolvedValueOnce({ ok: true, tokens: [] })
      .mockResolvedValueOnce({ ok: true, tokens: [tokenRecord] });
    const container = await renderPage();

    setInput(container, "Codex setup");
    await submitForm(container);

    expect(createAutomationToken).toHaveBeenCalledWith({
      name: "Codex setup",
      scopes: ["schemas:manage", "workflows:manage", "permissions:manage", "routes:read", "plans:apply"],
      ttlMinutes: 60,
    });
    expect(container.textContent).toContain("agx_auto_secret");
    expect(container.textContent).toContain("agx_auto_test...");
  });

  it("revokes active automation tokens", async () => {
    vi.mocked(listAutomationTokens)
      .mockResolvedValueOnce({ ok: true, tokens: [tokenRecord] })
      .mockResolvedValueOnce({ ok: true, tokens: [{ ...tokenRecord, revokedAt: "2026-05-22T00:01:00.000Z" }] });
    const container = await renderPage();

    await clickButton(container, "Revoke");

    expect(revokeAutomationToken).toHaveBeenCalledWith("auto_1");
    expect(container.textContent).toContain("Revoked");
  });
});

async function renderPage(): Promise<HTMLDivElement> {
  const container = document.createElement("div");
  const root = createRoot(container);
  roots.push({ container, root });
  document.body.appendChild(container);
  await act(async () => {
    root.render(<SettingsAutomationTokens />);
    await flushPromises();
  });
  return container;
}

function setInput(container: HTMLElement, value: string): void {
  const input = container.querySelector<HTMLInputElement>("input[name='name']");
  if (!input) throw new Error("Token name input not found");
  input.value = value;
}

async function submitForm(container: HTMLElement): Promise<void> {
  const form = container.querySelector<HTMLFormElement>(".automation-token-form");
  if (!form) throw new Error("Automation token form not found");
  await act(async () => {
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await flushPromises();
  });
}

async function clickButton(container: HTMLElement, text: string): Promise<void> {
  const button = [...container.querySelectorAll("button")].find((item) => item.textContent?.includes(text));
  if (!button) throw new Error(`Button not found: ${text}`);
  await act(async () => {
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await flushPromises();
  });
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
