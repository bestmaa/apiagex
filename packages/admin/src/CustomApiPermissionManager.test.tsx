// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteCustomApiRoute,
  listCustomApiPermissionHistory,
  listCustomApiPermissions,
  listCustomApiRoutes,
  listRoles,
  saveCustomApiPermissions,
  updateCustomApiRoute,
} from "./api";
import { CustomApiPermissionManager } from "./CustomApiPermissionManager";
import type { CustomApiRouteRecord } from "./custom-api.type";

vi.mock("./api", () => ({
  deleteCustomApiRoute: vi.fn(),
  listCustomApiPermissionHistory: vi.fn(),
  listCustomApiPermissions: vi.fn(),
  listCustomApiRoutes: vi.fn(),
  listRoles: vi.fn(),
  saveCustomApiPermissions: vi.fn(),
  updateCustomApiRoute: vi.fn(),
}));

const roots: Array<{ container: HTMLDivElement; root: Root }> = [];

const workflowRoute: CustomApiRouteRecord = {
  active: true,
  createdAt: "2026-05-20T00:00:00.000Z",
  groupName: "Workflows",
  id: "workflow.echo.post",
  lastSeenAt: "2026-05-20T00:00:00.000Z",
  method: "POST",
  name: "Echo workflow",
  path: "/api/custom/echo",
  permissionKey: "workflow.echo.post",
  updatedAt: "2026-05-20T00:00:00.000Z",
};

const inactiveWorkflowRoute: CustomApiRouteRecord = {
  active: false,
  createdAt: "2026-05-20T00:00:00.000Z",
  groupName: "Workflows",
  id: "workflow.old.post",
  lastSeenAt: "2026-05-20T00:00:00.000Z",
  method: "POST",
  name: "Old workflow",
  path: "/api/custom/old",
  permissionKey: "workflow.old.post",
  updatedAt: "2026-05-20T00:00:00.000Z",
};

describe("CustomApiPermissionManager", () => {
  beforeEach(() => {
    vi.mocked(listRoles).mockResolvedValue({
      ok: true,
      roles: [
        { description: "Writer", id: "role_writer", isOwner: false, name: "writer", roleKind: "api" },
        { description: "Open API role", id: "role_public", isOwner: false, name: "public", roleKind: "api" },
      ],
    });
    vi.mocked(listCustomApiRoutes).mockResolvedValue({
      ok: true,
      routes: [
        workflowRoute,
        {
          active: true,
          createdAt: "2026-05-20T00:00:00.000Z",
          groupName: "Reports",
          id: "custom.reports.sales.get",
          lastSeenAt: "2026-05-20T00:00:00.000Z",
          method: "GET",
          name: "Sales",
          path: "/api/custom/reports/sales",
          permissionKey: "custom.reports.sales.get",
          updatedAt: "2026-05-20T00:00:00.000Z",
        },
        inactiveWorkflowRoute,
      ],
    });
    vi.mocked(listCustomApiPermissions).mockResolvedValue({ ok: true, permissions: [] });
    vi.mocked(saveCustomApiPermissions).mockResolvedValue({
      ok: true,
      permissions: [{ allowed: true, customApiRouteId: workflowRoute.id, id: "perm_1", roleId: "role_public" }],
    });
    vi.mocked(listCustomApiPermissionHistory).mockResolvedValue({
      events: [
        {
          actorEmail: "owner@example.com",
          actorId: "owner_1",
          allowed: true,
          createdAt: "2026-05-20T01:00:00.000Z",
          customApiRouteId: workflowRoute.id,
          id: "event_1",
          roleId: "role_public",
        },
      ],
      ok: true,
    });
    vi.mocked(updateCustomApiRoute).mockResolvedValue({ ok: true, route: workflowRoute });
    vi.mocked(deleteCustomApiRoute).mockResolvedValue({ deleted: true, ok: true });
  });

  afterEach(() => {
    for (const { container, root } of roots.splice(0)) {
      root.unmount();
      container.remove();
    }
    vi.clearAllMocks();
  });

  it("shows workflow APIs in the custom permission flow", async () => {
    const container = await renderCustomApiPermissionManager();

    expect(container.textContent).toContain("Workflow API");
    expect(container.textContent).toContain("Workflows group");
    expect(container.textContent).toContain("workflow.echo.post");
    expect(container.textContent).toContain("Uses the same Custom API permission rules as code routes.");

    await updateSearch(container, "workflow.echo");
    expect(container.textContent).toContain("Echo workflow");
    expect(container.textContent).not.toContain("Sales");

    const checkbox = container.querySelector<HTMLInputElement>("input[type='checkbox']");
    if (!checkbox) throw new Error("MISSING_PERMISSION_CHECKBOX");
    await act(async () => {
      checkbox.click();
      await flushPromises();
    });

    const saveButton = buttonByText(container, "Save custom API permissions");
    await act(async () => {
      saveButton.click();
      await flushPromises();
    });

    expect(saveCustomApiPermissions).toHaveBeenCalledWith(
      "role_public",
      expect.arrayContaining([
        expect.objectContaining({ allowed: true, customApiRouteId: workflowRoute.id }),
      ]),
    );

    const historyButton = buttonByText(container, "View history");
    await act(async () => {
      historyButton.click();
      await flushPromises();
    });

    expect(listCustomApiPermissionHistory).toHaveBeenCalledWith(workflowRoute.id);
    expect(container.textContent).toContain("Permission history");
    expect(container.textContent).toContain("owner@example.com");
  });

  it("lets admins clean up inactive workflow APIs", async () => {
    const container = await renderCustomApiPermissionManager();
    await updateSearch(container, "workflow.old");

    expect(container.textContent).toContain("Old workflow");
    expect(container.textContent).toContain("Route not seen on last server start.");

    const deleteButton = buttonByText(container, "Delete inactive");
    await act(async () => {
      deleteButton.click();
      await flushPromises();
    });

    expect(deleteCustomApiRoute).toHaveBeenCalledWith(inactiveWorkflowRoute.id);
    expect(container.textContent).not.toContain("Old workflow");
  });
});

async function renderCustomApiPermissionManager(): Promise<HTMLDivElement> {
  const container = document.createElement("div");
  const root = createRoot(container);
  roots.push({ container, root });
  document.body.appendChild(container);
  await act(async () => {
    root.render(<CustomApiPermissionManager />);
    await flushPromises();
  });
  return container;
}

async function updateSearch(container: HTMLDivElement, value: string): Promise<void> {
  const search = container.querySelector<HTMLInputElement>("input[type='search']");
  if (!search) throw new Error("MISSING_SEARCH_INPUT");
  await act(async () => {
    setInputValue(search, value);
    await flushPromises();
  });
}

function setInputValue(input: HTMLInputElement, value: string): void {
  const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  valueSetter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function buttonByText(container: HTMLDivElement, text: string): HTMLButtonElement {
  const button = [...container.querySelectorAll("button")].find((item) => item.textContent?.includes(text));
  if (!button) throw new Error(`MISSING_BUTTON:${text}`);
  return button;
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
