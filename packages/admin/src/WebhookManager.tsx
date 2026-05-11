import { FormEvent, useEffect, useState } from "react";
import { Power, Send, Trash2 } from "lucide-react";
import { listSchemas } from "./api";
import { createWebhook, deleteWebhook, listWebhookDeliveries, listWebhooks, updateWebhook } from "./webhook-api";
import { StateMessage } from "./components/StateMessage";
import { StatusToast } from "./components/StatusToast";
import type { SchemaRecord } from "./schema.type";
import type { WebhookDeliveryRecord, WebhookEventType, WebhookRecord } from "./webhook.type";

const webhookEvents: WebhookEventType[] = ["entry.created", "entry.updated", "entry.deleted"];

export function WebhookManager() {
  const [schemas, setSchemas] = useState<SchemaRecord[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookRecord[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [deliveries, setDeliveries] = useState<WebhookDeliveryRecord[]>([]);
  const [status, setStatus] = useState("Webhooks loading");

  useEffect(() => {
    void load();
  }, []);

  async function load(nextSelectedId = selectedId) {
    const [schemaResult, webhookResult] = await Promise.all([listSchemas(), listWebhooks()]);
    if (!schemaResult.ok || !webhookResult.ok) {
      setStatus(schemaResult.error ?? webhookResult.error ?? "Webhooks failed");
      return;
    }
    const nextWebhooks = webhookResult.webhooks ?? [];
    const nextId = nextSelectedId || nextWebhooks[0]?.id || "";
    setSchemas(schemaResult.schemas ?? []);
    setWebhooks(nextWebhooks);
    setSelectedId(nextId);
    if (nextId) await loadDeliveries(nextId);
    setStatus("Webhooks ready");
  }

  async function loadDeliveries(webhookId: string) {
    const result = await listWebhookDeliveries(webhookId);
    setDeliveries(result.deliveries ?? []);
    if (!result.ok) setStatus(result.error ?? "Deliveries failed");
  }

  async function submitWebhook(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const events = webhookEvents.filter((name) => data.get(name) === "on");
    const result = await createWebhook({
      active: data.get("active") === "on",
      events,
      name: String(data.get("name") ?? ""),
      schemaId: String(data.get("schemaId") || "") || null,
      secret: String(data.get("secret") || "") || undefined,
      url: String(data.get("url") ?? ""),
    });
    if (!result.ok || !result.webhook) {
      setStatus(result.error ?? "Webhook create failed");
      return;
    }
    form.reset();
    await load(result.webhook.id);
    setStatus(`Created webhook: ${result.webhook.name}`);
  }

  async function toggleWebhook(webhook: WebhookRecord) {
    const result = await updateWebhook(webhook.id, { ...webhook, active: !webhook.active });
    await load(webhook.id);
    setStatus(result.ok ? "Webhook status updated" : result.error ?? "Webhook update failed");
  }

  async function removeWebhook(webhookId: string) {
    const result = await deleteWebhook(webhookId);
    await load("");
    setStatus(result.ok ? "Webhook deleted" : result.error ?? "Webhook delete failed");
  }

  return (
    <section aria-labelledby="webhook-manager-title">
      <h2 id="webhook-manager-title">Webhooks</h2>
      <p>Send signed content API change events to external URLs.</p>
      <form className="webhook-form" onSubmit={submitWebhook}>
        <label>Name <input name="name" placeholder="CRM sync" required /></label>
        <label>Target URL <input name="url" placeholder="https://example.com/webhooks/apiagex" required type="url" /></label>
        <label>Signing secret <input name="secret" placeholder="Generated if empty" /></label>
        <label>Collection
          <select name="schemaId">
            <option value="">All collections</option>
            {schemas.map((schema) => <option key={schema.id} value={schema.id}>{schema.name}</option>)}
          </select>
        </label>
        <fieldset className="webhook-event-grid">
          <legend>Events</legend>
          {webhookEvents.map((name) => (
            <label key={name}><input defaultChecked name={name} type="checkbox" /> {name}</label>
          ))}
          <label><input defaultChecked name="active" type="checkbox" /> Active</label>
        </fieldset>
        <button type="submit"><Send aria-hidden="true" size={16} /> Create webhook</button>
      </form>
      <WebhookList
        onDelete={(webhookId) => void removeWebhook(webhookId)}
        onSelect={(webhookId) => {
          setSelectedId(webhookId);
          void loadDeliveries(webhookId);
        }}
        onToggle={(webhook) => void toggleWebhook(webhook)}
        schemas={schemas}
        selectedId={selectedId}
        webhooks={webhooks}
      />
      <DeliveryList deliveries={deliveries} selected={webhooks.find((webhook) => webhook.id === selectedId)} />
      <StatusToast title="Webhook status">{status}</StatusToast>
    </section>
  );
}

function WebhookList(props: {
  onDelete: (webhookId: string) => void;
  onSelect: (webhookId: string) => void;
  onToggle: (webhook: WebhookRecord) => void;
  schemas: SchemaRecord[];
  selectedId: string;
  webhooks: WebhookRecord[];
}) {
  if (props.webhooks.length === 0) {
    return <StateMessage title="No webhooks yet" variant="empty">Create a webhook to send content API changes.</StateMessage>;
  }
  return (
    <div className="webhook-list" aria-label="Webhook list">
      {props.webhooks.map((webhook) => (
        <article className={webhook.id === props.selectedId ? "webhook-row is-active" : "webhook-row"} key={webhook.id}>
          <div>
            <strong>{webhook.name}</strong>
            <span>{collectionLabel(props.schemas, webhook.schemaId)} / {webhook.events.join(", ")}</span>
            <code>{webhook.url}</code>
          </div>
          <span>{webhook.active ? "Active" : "Paused"}</span>
          <button type="button" onClick={() => props.onSelect(webhook.id)}>Deliveries</button>
          <button type="button" onClick={() => props.onToggle(webhook)}><Power aria-hidden="true" size={16} /> Toggle</button>
          <button type="button" onClick={() => props.onDelete(webhook.id)}><Trash2 aria-hidden="true" size={16} /> Delete</button>
        </article>
      ))}
    </div>
  );
}

function DeliveryList({ deliveries, selected }: { deliveries: WebhookDeliveryRecord[]; selected?: WebhookRecord }) {
  if (!selected) return null;
  return (
    <section className="webhook-delivery-panel" aria-labelledby="webhook-delivery-title">
      <h3 id="webhook-delivery-title">Deliveries for {selected.name}</h3>
      {deliveries.length === 0 ? <StateMessage title="No deliveries yet" variant="empty">Run a matching content create, update, or delete.</StateMessage> : deliveries.map((delivery) => (
        <article className={`webhook-delivery-row webhook-delivery-${delivery.status}`} key={delivery.id}>
          <strong>{delivery.status}</strong>
          <span>Attempt {delivery.attempt} / {delivery.statusCode ?? delivery.error ?? "No status"}</span>
          <small>{delivery.createdAt}</small>
        </article>
      ))}
    </section>
  );
}

function collectionLabel(schemas: SchemaRecord[], schemaId: string | null): string {
  if (!schemaId) return "All collections";
  return schemas.find((schema) => schema.id === schemaId)?.name ?? "Unknown collection";
}
