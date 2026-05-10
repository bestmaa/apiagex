// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createUser, listRoles, listUsers } from "./api";
import { UserManager } from "./UserManager";
import type { RoleRecord } from "./role.type";
import type { UserRecord } from "./user.type";

vi.mock("./api", () => ({
  createUser: vi.fn(),
  listRoles: vi.fn(),
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

const roots: Array<{ container: HTMLDivElement; root: Root }> = [];

describe("UserManager", () => {
  beforeEach(() => {
    vi.mocked(listRoles).mockResolvedValue({ ok: true, roles: [role] });
    vi.mocked(listUsers).mockResolvedValue({ ok: true, users: [existingUser] });
    vi.mocked(createUser).mockResolvedValue({ ok: true, user: existingUser });
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
    expect(container.textContent).toContain("User list");
    expect(container.textContent).toContain(existingUser.email);
    expect(container.textContent).toContain("Create content API users and assign exactly one API role.");
    expect(container.textContent).not.toContain("English:");
    expect(container.textContent).not.toContain("Hinglish:");

    await clickButton(container, "Create user");
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
      .mockResolvedValueOnce({ ok: true, users: [] })
      .mockResolvedValueOnce({ ok: true, users: [createdUser] });
    vi.mocked(createUser).mockResolvedValue({ ok: true, user: createdUser });
    const container = await renderUserManager();

    await clickButton(container, "Create user");
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
