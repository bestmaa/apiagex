// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { listSchemas } from "./api";
import { WebhookManager } from "./WebhookManager";
import { createWebhook, listWebhookDeliveries, listWebhooks } from "./webhook-api";
import type { SchemaRecord } from "./schema.type";
import type { WebhookRecord } from "./webhook.type";

vi.mock("./api", () => ({ listSchemas: vi.fn() }));
vi.mock("./webhook-api", () => ({
  createWebhook: vi.fn(),
  deleteWebhook: vi.fn(),
  listWebhookDeliveries: vi.fn(),
  listWebhooks: vi.fn(),
  updateWebhook: vi.fn(),
}));

const schema: SchemaRecord = {
  createdAt: "2026-05-11T00:00:00.000Z",
  description: "",
  fields: [],
  id: "schema_article",
  name: "Article",
  slug: "article",
  updatedAt: "2026-05-11T00:00:00.000Z",
};

const webhook: WebhookRecord = {
  active: true,
  createdAt: "2026-05-11T00:00:00.000Z",
  events: ["entry.created"],
  id: "webhook_1",
  name: "CRM sync",
  schemaId: schema.id,
  updatedAt: "2026-05-11T00:00:00.000Z",
  url: "https://example.com/hook",
};

const roots: Array<{ container: HTMLDivElement; root: Root }> = [];

describe("WebhookManager", () => {
  beforeEach(() => {
    vi.mocked(listSchemas).mockResolvedValue({ ok: true, schemas: [schema] });
    vi.mocked(listWebhooks).mockResolvedValue({ ok: true, webhooks: [webhook] });
    vi.mocked(listWebhookDeliveries).mockResolvedValue({ ok: true, deliveries: [] });
    vi.mocked(createWebhook).mockResolvedValue({ ok: true, webhook });
  });

  afterEach(() => {
    for (const { container, root } of roots.splice(0)) {
      root.unmount();
      container.remove();
    }
    vi.clearAllMocks();
  });

  it("lists webhooks and creates a signed hook draft", async () => {
    const container = await renderWebhookManager();

    expect(container.textContent).toContain("CRM sync");
    expect(container.textContent).toContain("Deliveries for CRM sync");

    setInput(container, "input[name='name']", "Partner hook");
    setInput(container, "input[name='url']", "https://example.com/new-hook");
    setInput(container, "input[name='secret']", "client-secret");

    await act(async () => {
      container.querySelector<HTMLFormElement>(".webhook-form")?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      await flushPromises();
    });

    expect(createWebhook).toHaveBeenCalledWith({
      active: true,
      events: ["entry.created", "entry.updated", "entry.deleted"],
      name: "Partner hook",
      schemaId: null,
      secret: "client-secret",
      url: "https://example.com/new-hook",
    });
  });
});

async function renderWebhookManager(): Promise<HTMLDivElement> {
  const container = document.createElement("div");
  const root = createRoot(container);
  roots.push({ container, root });
  document.body.appendChild(container);
  await act(async () => {
    root.render(<WebhookManager />);
    await flushPromises();
  });
  return container;
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
