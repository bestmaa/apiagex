// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSchema, deleteSchema, listEntries, listSchemas, updateSchema } from "./api";
import { SchemaBuilder } from "./SchemaBuilder";

vi.mock("./api", () => ({
  createSchema: vi.fn(),
  deleteSchema: vi.fn(),
  listEntries: vi.fn(),
  listSchemas: vi.fn(),
  updateSchema: vi.fn(),
}));

const roots: Array<{ container: HTMLDivElement; root: Root }> = [];

describe("SchemaBuilder", () => {
  beforeEach(() => {
    vi.mocked(createSchema).mockResolvedValue({ ok: true });
    vi.mocked(deleteSchema).mockResolvedValue({ ok: true });
    vi.mocked(listEntries).mockResolvedValue({ ok: true, entries: [] });
    vi.mocked(listSchemas).mockResolvedValue({ ok: true, schemas: [] });
    vi.mocked(updateSchema).mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    for (const { container, root } of roots.splice(0)) {
      root.unmount();
      container.remove();
    }
    vi.clearAllMocks();
  });

  it("keeps focus while editing a field slug", async () => {
    const container = await renderSchemaBuilder();
    await clickButton(container, "Add schema");
    const fieldSlug = container.querySelectorAll<HTMLInputElement>("input[pattern]")[1];
    if (!fieldSlug) throw new Error("Field slug input not found");

    fieldSlug.focus();
    await setControlledInput(fieldSlug, "article-title");

    expect(document.activeElement).toBe(fieldSlug);
    expect(fieldSlug.value).toBe("article-title");
  });
});

async function renderSchemaBuilder(): Promise<HTMLDivElement> {
  const container = document.createElement("div");
  const root = createRoot(container);
  roots.push({ container, root });
  document.body.appendChild(container);
  await act(async () => {
    root.render(<SchemaBuilder />);
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

async function setControlledInput(input: HTMLInputElement, value: string): Promise<void> {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  if (!setter) throw new Error("Input value setter not found");
  await act(async () => {
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await flushPromises();
  });
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
