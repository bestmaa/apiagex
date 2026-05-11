import { useEffect, useMemo, useState } from "react";
import { listRealtimeSettings, saveRealtimeConfig } from "./realtime-api";
import type { RealtimeConfigRecord, RealtimeConnectionRecord, RealtimeEventRecord, RealtimeEventType } from "./realtime.type";
import type { SchemaRecord } from "./schema.type";
import { StateMessage } from "./components/StateMessage";

const eventOptions: RealtimeEventType[] = ["entry.created", "entry.updated", "entry.deleted"];

export function RealtimeManager() {
  const [configs, setConfigs] = useState<RealtimeConfigRecord[]>([]);
  const [connections, setConnections] = useState<RealtimeConnectionRecord[]>([]);
  const [events, setEvents] = useState<RealtimeEventRecord[]>([]);
  const [retention, setRetention] = useState(1000);
  const [schemas, setSchemas] = useState<SchemaRecord[]>([]);
  const [status, setStatus] = useState("Realtime settings ready");

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    const result = await listRealtimeSettings();
    if (!result.ok) return setStatus(result.error ?? "Realtime settings failed");
    setConfigs(result.configs ?? []);
    setConnections(result.connections ?? []);
    setEvents(result.events ?? []);
    setRetention(result.retention?.eventsPerSchema ?? 1000);
    setSchemas(result.schemas ?? []);
  }

  async function save(schemaId: string, enabled: boolean, events: RealtimeEventType[]) {
    setStatus("Saving realtime setting");
    const result = await saveRealtimeConfig(schemaId, { enabled, events });
    setStatus(result.ok ? "Realtime setting saved" : result.error ?? "Realtime save failed");
    await load();
  }

  const configBySchema = useMemo(() => new Map(configs.map((config) => [config.schemaId, config])), [configs]);

  return (
    <section aria-labelledby="realtime-manager-title">
      <h2 id="realtime-manager-title">Realtime API</h2>
      <p>Enable WebSocket events only for the collections that need live client screens.</p>
      <p className="helper-text">Client examples are in <a href="#docs/realtime">Realtime client docs</a>.</p>
      {schemas.length === 0 ? (
        <StateMessage title="No collections yet" variant="empty">Create a schema before enabling realtime.</StateMessage>
      ) : (
        <div className="role-list" aria-label="Realtime collections">
          {schemas.map((schema) => (
            <RealtimeSchemaRow
              config={configBySchema.get(schema.id)}
              connectionCount={connections.filter((connection) => connection.schemaId === schema.id).length}
              key={schema.id}
              onSave={save}
              schema={schema}
            />
          ))}
        </div>
      )}
      <RealtimeHistory events={events} retention={retention} />
      <StateMessage title="Realtime status">{status}</StateMessage>
    </section>
  );
}

function RealtimeHistory({ events, retention }: { events: RealtimeEventRecord[]; retention: number }) {
  return (
    <section className="settings-panel" aria-labelledby="realtime-history-title">
      <h3 id="realtime-history-title">Recent realtime events</h3>
      <p>History keeps the latest {retention} events per collection for reconnect replay.</p>
      {events.length === 0 ? (
        <StateMessage title="No realtime events yet" variant="empty">Enable a collection and write content to create realtime history.</StateMessage>
      ) : (
        <div className="api-table" role="table" aria-label="Recent realtime events">
          <div className="api-table-row api-table-head" role="row">
            <span>Event</span>
            <span>Collection</span>
            <span>Entry</span>
            <span>Time</span>
          </div>
          {events.map((event) => (
            <div className="api-table-row" role="row" key={event.id}>
              <span><code>{event.eventType}</code><small>{event.id}</small></span>
              <span>{event.schemaSlug}</span>
              <span><code>{event.entryId}</code></span>
              <span>{new Date(event.occurredAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function RealtimeSchemaRow({
  config,
  connectionCount,
  onSave,
  schema,
}: {
  config: RealtimeConfigRecord | undefined;
  connectionCount: number;
  onSave: (schemaId: string, enabled: boolean, events: RealtimeEventType[]) => void;
  schema: SchemaRecord;
}) {
  const [enabled, setEnabled] = useState(Boolean(config?.enabled));
  const [events, setEvents] = useState<RealtimeEventType[]>(config?.events ?? eventOptions);

  useEffect(() => {
    setEnabled(Boolean(config?.enabled));
    setEvents(config?.events ?? eventOptions);
  }, [config]);

  function toggleEvent(event: RealtimeEventType, checked: boolean) {
    setEvents((current) => checked ? [...new Set([...current, event])] : current.filter((item) => item !== event));
  }

  return (
    <article className={enabled ? "role-card is-selected" : "role-card"}>
      <div className="role-card-main">
        <strong>{schema.name}</strong>
        <p><code>/api/content/{schema.slug}</code></p>
        <span>{connectionCount} live connections</span>
      </div>
      <div className="permission-list">
        <label><input checked={enabled} onChange={(event) => setEnabled(event.currentTarget.checked)} type="checkbox" /> Enabled</label>
        {eventOptions.map((eventName) => (
          <label key={eventName}>
            <input
              checked={events.includes(eventName)}
              onChange={(event) => toggleEvent(eventName, event.currentTarget.checked)}
              type="checkbox"
            />
            {eventName}
          </label>
        ))}
      </div>
      <button onClick={() => onSave(schema.id, enabled, events)} type="button">Save realtime</button>
    </article>
  );
}
