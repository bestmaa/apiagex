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

  it("auto-fills slugs from names until the slug is edited manually", async () => {
    const container = await renderSchemaBuilder();
    await clickButton(container, "Add schema");
    const [schemaName, schemaSlug, fieldName, fieldSlug] = [...container.querySelectorAll<HTMLInputElement>("input")];
    if (!schemaName || !schemaSlug || !fieldName || !fieldSlug) throw new Error("Schema form inputs not found");

    await setControlledInput(schemaName, "Blog Article");
    await setControlledInput(fieldName, "Hero Title");

    expect(schemaSlug.value).toBe("blog-article");
    expect(fieldSlug.value).toBe("hero-title");

    await setControlledInput(schemaSlug, "articles");
    await setControlledInput(fieldSlug, "heading");
    await setControlledInput(schemaName, "News Article");
    await setControlledInput(fieldName, "Display Title");

    expect(schemaSlug.value).toBe("articles");
    expect(fieldSlug.value).toBe("heading");
    expect(schemaName.value).toBe("News Article");
    expect(fieldName.value).toBe("Display Title");
  });

  it("sends enum options when creating a schema", async () => {
    const container = await renderSchemaBuilder();
    await clickButton(container, "Add schema");
    const [schemaName, , fieldName] = [...container.querySelectorAll<HTMLInputElement>("input")];
    const typeSelect = container.querySelector<HTMLSelectElement>("select");
    if (!schemaName || !fieldName || !typeSelect) throw new Error("Schema form controls not found");

    await setControlledInput(schemaName, "Post");
    await setControlledInput(fieldName, "Status");
    await setControlledSelect(typeSelect, "enum");
    const options = container.querySelector<HTMLTextAreaElement>(".enum-options-field textarea");
    if (!options) throw new Error("Enum options input not found");
    await setControlledTextarea(options, "draft\npublished\narchived");
    await submitForm(container);

    expect(createSchema).toHaveBeenCalledWith(expect.objectContaining({
      fields: [expect.objectContaining({
        options: ["draft", "published", "archived"],
        slug: "status",
        type: "enum",
      })],
      slug: "post",
    }));
  });

  it("sends multiSelect options when creating a schema", async () => {
    const container = await renderSchemaBuilder();
    await clickButton(container, "Add schema");
    const [schemaName, , fieldName] = [...container.querySelectorAll<HTMLInputElement>("input")];
    const typeSelect = container.querySelector<HTMLSelectElement>("select");
    if (!schemaName || !fieldName || !typeSelect) throw new Error("Schema form controls not found");

    await setControlledInput(schemaName, "Product");
    await setControlledInput(fieldName, "Tags");
    await setControlledSelect(typeSelect, "multiSelect");
    const options = container.querySelector<HTMLTextAreaElement>(".enum-options-field textarea");
    if (!options) throw new Error("MultiSelect options input not found");
    await setControlledTextarea(options, "new\nsale\nfeatured");
    await submitForm(container);

    expect(createSchema).toHaveBeenCalledWith(expect.objectContaining({
      fields: [expect.objectContaining({
        options: ["new", "sale", "featured"],
        slug: "tags",
        type: "multiSelect",
      })],
      slug: "product",
    }));
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

async function setControlledSelect(select: HTMLSelectElement, value: string): Promise<void> {
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set;
  if (!setter) throw new Error("Select value setter not found");
  await act(async () => {
    setter.call(select, value);
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await flushPromises();
  });
}

async function setControlledTextarea(textarea: HTMLTextAreaElement, value: string): Promise<void> {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
  if (!setter) throw new Error("Textarea value setter not found");
  await act(async () => {
    setter.call(textarea, value);
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    await flushPromises();
  });
}

async function submitForm(container: HTMLElement): Promise<void> {
  const form = container.querySelector("form");
  if (!form) throw new Error("Schema form not found");
  await act(async () => {
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await flushPromises();
  });
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
