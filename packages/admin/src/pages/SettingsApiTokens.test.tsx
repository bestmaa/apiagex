// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApiToken, listApiTokens, listRoles, revokeApiToken } from "../api";
import { SettingsApiTokens } from "./SettingsApiTokens";

vi.mock("../api", () => ({
  createApiToken: vi.fn(),
  listApiTokens: vi.fn(),
  listRoles: vi.fn(),
  revokeApiToken: vi.fn(),
}));

const roots: Array<{ container: HTMLDivElement; root: Root }> = [];

describe("SettingsApiTokens", () => {
  beforeEach(() => {
    vi.mocked(createApiToken).mockResolvedValue({ ok: true, token: "apiagex_test_token" });
    vi.mocked(listApiTokens).mockResolvedValue({ ok: true, tokens: [] });
    vi.mocked(listRoles).mockResolvedValue({
      ok: true,
      roles: [
        {
          description: "Read content",
          id: "role_reader",
          isOwner: false,
          name: "reader",
          roleKind: "api",
        },
      ],
    });
    vi.mocked(revokeApiToken).mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    for (const { container, root } of roots.splice(0)) {
      root.unmount();
      container.remove();
    }
    vi.clearAllMocks();
  });

  it("loads content roles before showing the token panel", async () => {
    const container = await renderSettingsApiTokens();

    expect(container.textContent).toContain("API Tokens");
    expect(container.textContent).toContain("Content role");
    expect(container.textContent).toContain("Create token");
    expect(listApiTokens).toHaveBeenCalledWith("role_reader");
  });
});

async function renderSettingsApiTokens(): Promise<HTMLDivElement> {
  const container = document.createElement("div");
  const root = createRoot(container);
  roots.push({ container, root });
  document.body.appendChild(container);
  await act(async () => {
    root.render(<SettingsApiTokens />);
    await flushPromises();
  });
  return container;
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
