// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  listRolePermissions,
  listRoles,
  listSchemas,
  saveRolePermissions,
} from "./api";
import { ApiPermissionManager } from "./ApiPermissionManager";

vi.mock("./api", () => ({
  listRolePermissions: vi.fn(),
  listRoles: vi.fn(),
  listSchemas: vi.fn(),
  saveRolePermissions: vi.fn(),
}));

const roots: Array<{ container: HTMLDivElement; root: Root }> = [];

describe("ApiPermissionManager", () => {
  beforeEach(() => {
    vi.mocked(listRoles).mockResolvedValue({
      ok: true,
      roles: [
        { description: "Private reader", id: "role_reader", isOwner: false, name: "reader", roleKind: "api" },
        { description: "Open API role", id: "role_public", isOwner: false, name: "public", roleKind: "api" },
      ],
    });
    vi.mocked(listSchemas).mockResolvedValue({
      ok: true,
      schemas: [
        {
          description: "",
          fields: [{ name: "Title", required: false, slug: "title", type: "text" }],
          id: "schema_article",
          name: "Article",
          slug: "article",
        },
      ],
    });
    vi.mocked(listRolePermissions).mockResolvedValue({ ok: true, permissions: [] });
    vi.mocked(saveRolePermissions).mockResolvedValue({ ok: true, permissions: [] });
  });

  afterEach(() => {
    for (const { container, root } of roots.splice(0)) {
      root.unmount();
      container.remove();
    }
    vi.clearAllMocks();
  });

  it("shows public as the open API permission target", async () => {
    const container = await renderApiPermissionManager();

    expect(container.textContent).toContain("All generated content APIs are blocked by default");
    expect(container.textContent).toContain("public - open/no token");
    expect(container.textContent).toContain("realtime = WebSocket subscribe");
    expect(container.textContent).toContain("Allowed public actions are reachable without Authorization headers");
    expect(container.textContent).toContain("content-user login token or an API key");
    expect(listRolePermissions).toHaveBeenCalledWith("role_public");
  });

  it("shows access counts for every role and selects a role from the role card", async () => {
    vi.mocked(listRolePermissions).mockImplementation(async (roleId) => ({
      ok: true,
      permissions: roleId === "role_public"
        ? [{ action: "getAll", allowed: true, id: "public_getAll", roleId, schemaId: "schema_article" }]
        : [{ action: "get", allowed: true, id: "reader_get", roleId, schemaId: "schema_article" }],
    }));
    const container = await renderApiPermissionManager();

    expect(container.textContent).toContain("public");
    expect(container.textContent).toContain("reader");
    expect(container.textContent?.match(/1\/7 allowed/g)?.length).toBeGreaterThanOrEqual(2);

    const readerRow = Array.from(container.querySelectorAll<HTMLElement>(".role-row"))
      .find((row) => row.textContent?.includes("reader"));
    expect(readerRow).toBeTruthy();
    await act(async () => {
      readerRow?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await flushPromises();
    });

    const select = container.querySelector<HTMLSelectElement>("select");
    expect(select?.value).toBe("role_reader");
    expect(listRolePermissions).toHaveBeenCalledWith("role_reader");
    expect(container.textContent).toContain("POST /api/auth/login-user");
    expect(container.textContent).toContain("Authorization: Bearer TOKEN");
  });
});

async function renderApiPermissionManager(): Promise<HTMLDivElement> {
  const container = document.createElement("div");
  const root = createRoot(container);
  roots.push({ container, root });
  document.body.appendChild(container);
  await act(async () => {
    root.render(<ApiPermissionManager />);
    await flushPromises();
  });
  return container;
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
