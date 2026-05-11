// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RealtimeManager } from "./RealtimeManager";
import { listRealtimeSettings, saveRealtimeConfig } from "./realtime-api";
import type { RealtimeConfigRecord } from "./realtime.type";
import type { SchemaRecord } from "./schema.type";

vi.mock("./realtime-api", () => ({
  listRealtimeSettings: vi.fn(),
  saveRealtimeConfig: vi.fn(),
}));

const schema: SchemaRecord = {
  createdAt: "2026-05-11T00:00:00.000Z",
  description: "",
  fields: [],
  id: "schema_orders",
  name: "Orders",
  slug: "orders",
  updatedAt: "2026-05-11T00:00:00.000Z",
};

const config: RealtimeConfigRecord = {
  createdAt: "2026-05-11T00:00:00.000Z",
  enabled: true,
  events: ["entry.created", "entry.updated"],
  schemaId: schema.id,
  updatedAt: "2026-05-11T00:00:00.000Z",
};

const roots: Array<{ container: HTMLDivElement; root: Root }> = [];

describe("RealtimeManager", () => {
  beforeEach(() => {
    vi.mocked(listRealtimeSettings).mockResolvedValue({
      ok: true,
      configs: [config],
      connections: [{ connectedAt: config.createdAt, id: "rtc_1", pendingAcks: 1, schemaId: schema.id, schemaSlug: schema.slug }],
      events: [{
        createdAt: config.createdAt,
        entry: { data: { title: "Live order" } },
        entryId: "entry_1",
        eventType: "entry.created",
        id: "rte_1",
        messageId: "rtm_1",
        occurredAt: config.createdAt,
        schemaId: schema.id,
        schemaSlug: schema.slug,
      }],
      retention: { eventsPerSchema: 1000 },
      schemas: [schema],
    });
    vi.mocked(saveRealtimeConfig).mockResolvedValue({ ok: true, config });
  });

  afterEach(() => {
    for (const { container, root } of roots.splice(0)) {
      root.unmount();
      container.remove();
    }
    vi.clearAllMocks();
  });

  it("lists realtime collections and saves selected events", async () => {
    const container = await renderRealtimeManager();

    expect(container.textContent).toContain("Orders");
    expect(container.textContent).toContain("1 live connections");
    expect(container.textContent).toContain("Recent realtime events");
    expect(container.textContent).toContain("rte_1");
    expect(container.querySelector<HTMLAnchorElement>("a[href='#docs/realtime']")?.textContent).toContain("Realtime client docs");

    await act(async () => {
      container.querySelector<HTMLButtonElement>("button")?.click();
      await flushPromises();
    });

    expect(saveRealtimeConfig).toHaveBeenCalledWith(schema.id, {
      enabled: true,
      events: ["entry.created", "entry.updated"],
    });
  });
});

async function renderRealtimeManager(): Promise<HTMLDivElement> {
  const container = document.createElement("div");
  const root = createRoot(container);
  roots.push({ container, root });
  document.body.appendChild(container);
  await act(async () => {
    root.render(<RealtimeManager />);
    await flushPromises();
  });
  return container;
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
