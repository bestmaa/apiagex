// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createControlUser, createUser, listControlUsers, listUsers } from "./api";
import { UserManager } from "./UserManager";
import type { RoleRecord } from "./role.type";
import type { UserRecord } from "./user.type";

vi.mock("./api", () => ({
  createControlUser: vi.fn(),
  createUser: vi.fn(),
  listControlUsers: vi.fn(),
  listUsers: vi.fn(),
}));

const role: RoleRecord = {
  description: "Editor",
  id: "role_editor",
  isOwner: false,
  name: "editor",
  roleKind: "api",
};

const existingUser: UserRecord = {
  email: "editor@apiagex.local",
  id: "user_editor",
  roleId: role.id,
  roleKind: "api",
  roleName: role.name,
};

const adminRole: RoleRecord = {
  description: "Schema manager",
  id: "role_schema_manager",
  isOwner: false,
  name: "schema-manager",
  roleKind: "admin",
};

const existingAdminUser: UserRecord = {
  email: "schema-admin@apiagex.local",
  id: "user_schema_admin",
  roleId: adminRole.id,
  roleKind: "admin",
  roleName: adminRole.name,
};

const roots: Array<{ container: HTMLDivElement; root: Root }> = [];

describe("UserManager", () => {
  beforeEach(() => {
    vi.mocked(listUsers).mockResolvedValue({ ok: true, roles: [role], users: [existingUser] });
    vi.mocked(listControlUsers).mockResolvedValue({ ok: true, roles: [adminRole], users: [existingAdminUser] });
    vi.mocked(createUser).mockResolvedValue({ ok: true, user: existingUser });
    vi.mocked(createControlUser).mockResolvedValue({ ok: true, user: existingAdminUser });
  });

  afterEach(() => {
    for (const { container, root } of roots.splice(0)) {
      root.unmount();
      container.remove();
    }
    vi.clearAllMocks();
  });

  it("shows the user list before opening the create form", async () => {
    const container = await renderUserManager();

    expect(container.querySelector(".user-form")).toBeNull();
    expect(container.textContent).toContain("Content user list");
    expect(container.textContent).toContain(existingUser.email);
    expect(container.textContent).toContain("Create content API users or control admin users and assign exactly one role.");
    expect(container.textContent).not.toContain("English:");
    expect(container.textContent).not.toContain("Hinglish:");

    await clickButton(container, "Create Content user");
    expect(container.querySelector(".user-form")).not.toBeNull();

    await clickButton(container, "Cancel");
    expect(container.querySelector(".user-form")).toBeNull();
    expect(container.textContent).toContain(existingUser.email);
  });

  it("creates a user, refreshes the list, and closes the form", async () => {
    const createdUser: UserRecord = {
      email: "writer@apiagex.local",
      id: "user_writer",
      roleId: role.id,
      roleKind: "api",
      roleName: role.name,
    };
    vi.mocked(listUsers)
      .mockResolvedValueOnce({ ok: true, roles: [role], users: [] })
      .mockResolvedValueOnce({ ok: true, roles: [role], users: [createdUser] });
    vi.mocked(createUser).mockResolvedValue({ ok: true, user: createdUser });
    const container = await renderUserManager();

    await clickButton(container, "Create Content user");
    setInput(container, "#user-email", createdUser.email);
    setInput(container, "#user-password", "UserPass123!");
    setInput(container, "#user-role", role.id);

    await act(async () => {
      container.querySelector<HTMLFormElement>(".user-form")?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      await flushPromises();
    });

    expect(createUser).toHaveBeenCalledWith({
      email: createdUser.email,
      password: "UserPass123!",
      roleId: role.id,
    });
    expect(container.querySelector(".user-form")).toBeNull();
    expect(container.textContent).toContain(createdUser.email);
  });

  it("switches to control admin users and creates one with an admin role", async () => {
    vi.mocked(listControlUsers)
      .mockResolvedValueOnce({ ok: true, roles: [adminRole], users: [existingAdminUser] })
      .mockResolvedValueOnce({ ok: true, roles: [adminRole], users: [existingAdminUser] });
    const container = await renderUserManager();

    await clickButton(container, "Control admin users");
    expect(container.textContent).toContain("Control admin user list");
    expect(container.textContent).toContain(existingAdminUser.email);
    expect(container.textContent).toContain("Admin role: schema-manager");

    await clickButton(container, "Create Control admin user");
    setInput(container, "#user-email", existingAdminUser.email);
    setInput(container, "#user-password", "AdminPass123!");
    setInput(container, "#user-role", adminRole.id);

    await act(async () => {
      container.querySelector<HTMLFormElement>(".user-form")?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      await flushPromises();
    });

    expect(createControlUser).toHaveBeenCalledWith({
      email: existingAdminUser.email,
      password: "AdminPass123!",
      roleId: adminRole.id,
    });
  });
});

async function renderUserManager(): Promise<HTMLDivElement> {
  const container = document.createElement("div");
  const root = createRoot(container);
  roots.push({ container, root });
  document.body.appendChild(container);
  await act(async () => {
    root.render(<UserManager />);
    await flushPromises();
  });
  return container;
}

async function clickButton(container: HTMLElement, text: string): Promise<void> {
  const button = [...container.querySelectorAll("button")].find((item) => item.textContent?.includes(text));
  if (!button) throw new Error(`Button not found: ${text}`);
  await act(async () => {
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await flushPromises();
  });
}

function setInput(container: HTMLElement, selector: string, value: string): void {
  const input = container.querySelector<HTMLInputElement | HTMLSelectElement>(selector);
  if (!input) throw new Error(`Input not found: ${selector}`);
  input.value = value;
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
