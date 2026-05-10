// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApiToken, listApiTokens, revokeApiToken } from "./api";
import { RoleTokenPanel } from "./RoleTokenPanel";
import type { ApiTokenRecord } from "./role.type";

vi.mock("./api", () => ({
  createApiToken: vi.fn(),
  listApiTokens: vi.fn(),
  revokeApiToken: vi.fn(),
}));

const tokenRecord: ApiTokenRecord = {
  createdAt: "2026-05-09T00:00:00.000Z",
  id: "token_1",
  lastUsedAt: null,
  name: "Partner app",
  revokedAt: null,
  roleId: "role_reader",
  roleName: "reader",
  tokenPrefix: "agx_partner",
};

const roots: Array<{ container: HTMLDivElement; root: Root }> = [];

describe("RoleTokenPanel", () => {
  afterEach(() => {
    for (const { container, root } of roots.splice(0)) {
      root.unmount();
      container.remove();
    }
    vi.clearAllMocks();
  });

  it("creates a token and shows the secret once", async () => {
    vi.mocked(listApiTokens)
      .mockResolvedValueOnce({ ok: true, tokens: [] })
      .mockResolvedValueOnce({ ok: true, tokens: [tokenRecord] });
    vi.mocked(createApiToken).mockResolvedValue({
      ok: true,
      token: "agx_partner_secret",
      tokenRecord,
    });
    const onStatus = vi.fn();
    const container = await renderPanel(onStatus);

    setInput(container, "Partner app");
    await act(async () => {
      container.querySelector<HTMLFormElement>(".role-token-form")?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      await flushPromises();
    });

    expect(createApiToken).toHaveBeenCalledWith("role_reader", "Partner app");
    expect(container.textContent).toContain("agx_partner_secret");
    expect(container.textContent).toContain("agx_partner...");
    expect(onStatus).toHaveBeenCalledWith("Created API token for reader");
  });

  it("revokes active tokens", async () => {
    const revoked = { ...tokenRecord, revokedAt: "2026-05-09T00:01:00.000Z" };
    vi.mocked(listApiTokens)
      .mockResolvedValueOnce({ ok: true, tokens: [tokenRecord] })
      .mockResolvedValueOnce({ ok: true, tokens: [revoked] });
    vi.mocked(revokeApiToken).mockResolvedValue({ ok: true, token: revoked });
    const onStatus = vi.fn();
    const container = await renderPanel(onStatus);

    await clickButton(container, "Revoke");

    expect(revokeApiToken).toHaveBeenCalledWith("role_reader", "token_1");
    expect(container.textContent).toContain("Revoked");
    expect(onStatus).toHaveBeenCalledWith("API token revoked");
  });
});

async function renderPanel(onStatus: (status: string) => void): Promise<HTMLDivElement> {
  const container = document.createElement("div");
  const root = createRoot(container);
  roots.push({ container, root });
  document.body.appendChild(container);
  await act(async () => {
    root.render(<RoleTokenPanel onStatus={onStatus} roleId="role_reader" roleName="reader" />);
    await flushPromises();
  });
  return container;
}

function setInput(container: HTMLElement, value: string): void {
  const input = container.querySelector<HTMLInputElement>("input[name='name']");
  if (!input) throw new Error("Token name input not found");
  input.value = value;
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
