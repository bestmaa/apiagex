// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createEntry, fileToMediaUpload, updateEntry } from "./api";
import { GeneratedEntryForm } from "./EntryForm";

vi.mock("./api", () => ({
  createEntry: vi.fn(),
  fileToMediaUpload: vi.fn(),
  updateEntry: vi.fn(),
}));

const roots: Array<{ container: HTMLDivElement; root: Root }> = [];

describe("GeneratedEntryForm", () => {
  beforeEach(() => {
    vi.mocked(createEntry).mockResolvedValue({ ok: true, entry: { id: "entry_123", schemaId: "schema_1", data: {}, createdAt: "", updatedAt: "" } });
    vi.mocked(updateEntry).mockResolvedValue({ ok: true });
    vi.mocked(fileToMediaUpload).mockResolvedValue({
      contentBase64: "aGVsbG8gbWVkaWE=",
      contentType: "image/png",
      filename: "hero.png",
    });
  });

  afterEach(() => {
    for (const { container, root } of roots.splice(0)) {
      root.unmount();
      container.remove();
    }
    vi.clearAllMocks();
  });

  it("uploads a media file and saves the returned URL", async () => {
    const container = await renderEntryForm();
    const fileInput = container.querySelector<HTMLInputElement>("input[type='file']");
    if (!fileInput) throw new Error("Media file input not found");
    const file = new File(["hello media"], "hero.png", { type: "image/png" });

    await act(async () => {
      Object.defineProperty(fileInput, "files", { configurable: true, value: [file] });
      fileInput.dispatchEvent(new Event("change", { bubbles: true }));
      await flushPromises();
    });
    await submitForm(container);

    expect(fileToMediaUpload).toHaveBeenCalledWith(file);
    expect(createEntry).toHaveBeenCalledWith("schema_1", {}, {
      hero: {
        contentBase64: "aGVsbG8gbWVkaWE=",
        contentType: "image/png",
        filename: "hero.png",
      },
    });
  });

  it("reads typed primitive and multiSelect field values", async () => {
    const container = await renderEntryForm({
      fields: [
        { name: "Email", required: true, slug: "email", type: "email" },
        { name: "Age", required: false, slug: "age", type: "integer" },
        { name: "Price", required: false, slug: "price", type: "decimal" },
        { name: "Tags", options: ["new", "sale"], required: false, slug: "tags", type: "multiSelect" },
        { name: "Password", required: false, slug: "password", type: "password" },
      ],
    });
    const email = container.querySelector<HTMLInputElement>("input[name='email']");
    const age = container.querySelector<HTMLInputElement>("input[name='age']");
    const price = container.querySelector<HTMLInputElement>("input[name='price']");
    const password = container.querySelector<HTMLInputElement>("input[name='password']");
    const tags = container.querySelector<HTMLSelectElement>("select[name='tags']");
    if (!email || !age || !price || !password || !tags) throw new Error("Expected entry controls not found");

    await setControlledInput(email, "user@example.com");
    await setControlledInput(age, "7");
    await setControlledInput(price, "19.99");
    await setControlledInput(password, "secret");
    await setMultiSelect(tags, ["new", "sale"]);
    await submitForm(container);

    expect(age.type).toBe("number");
    expect(age.step).toBe("1");
    expect(price.step).toBe("0.01");
    expect(password.type).toBe("password");
    expect(createEntry).toHaveBeenCalledWith("schema_1", {
      age: 7,
      email: "user@example.com",
      password: "secret",
      price: 19.99,
      tags: ["new", "sale"],
    }, {});
  });

  it("restricts image upload controls to image file types", async () => {
    const container = await renderEntryForm({
      fields: [{ name: "Hero", required: false, slug: "hero", type: "image" }],
    });
    const fileInput = container.querySelector<HTMLInputElement>("input[type='file']");
    if (!fileInput) throw new Error("Image file input not found");

    expect(fileInput.accept).toBe("image/png,image/jpeg,image/gif,image/webp");
  });
});

async function renderEntryForm(schemaPatch: Partial<Parameters<typeof GeneratedEntryForm>[0]["schema"]> = {}): Promise<HTMLDivElement> {
  const container = document.createElement("div");
  const root = createRoot(container);
  roots.push({ container, root });
  document.body.appendChild(container);
  await act(async () => {
    root.render(
      <GeneratedEntryForm
        editingEntry={null}
        onCancelEdit={() => undefined}
        onCreated={async () => undefined}
        relationEntries={{}}
        schema={{
          description: "",
          fields: [{ name: "Hero", required: false, slug: "hero", type: "media" }],
          id: "schema_1",
          name: "Article",
          slug: "article",
          ...schemaPatch,
        }}
      />,
    );
    await flushPromises();
  });
  return container;
}

async function submitForm(container: HTMLElement): Promise<void> {
  const form = container.querySelector("form");
  if (!form) throw new Error("Entry form not found");
  await act(async () => {
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
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

async function setMultiSelect(select: HTMLSelectElement, values: string[]): Promise<void> {
  await act(async () => {
    for (const option of [...select.options]) {
      option.selected = values.includes(option.value);
    }
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await flushPromises();
  });
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
