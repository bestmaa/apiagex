import { ExternalLink, FileJson, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { getApiDocsSettings, saveApiDocsSettings } from "../api";
import { StateMessage } from "../components/StateMessage";
import { StatusToast } from "../components/StatusToast";

export function SettingsApiDocs() {
  const [enabled, setEnabled] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [status, setStatus] = useState("API docs settings loading");

  useEffect(() => {
    void loadSettings();
  }, []);

  async function loadSettings() {
    const result = await getApiDocsSettings();
    if (!result.ok || !result.settings) {
      setStatus(result.error ?? "API docs settings failed");
      setLoaded(true);
      return;
    }
    setEnabled(result.settings.enabled);
    setUpdatedAt(result.settings.updatedAt);
    setStatus("API docs settings ready");
    setLoaded(true);
  }

  async function saveSettings() {
    setStatus("Saving API docs settings");
    const result = await saveApiDocsSettings(enabled);
    if (!result.ok || !result.settings) {
      setStatus(result.error ?? "API docs settings failed");
      return;
    }
    setEnabled(result.settings.enabled);
    setUpdatedAt(result.settings.updatedAt);
    setStatus(result.settings.enabled ? "Swagger docs enabled" : "Swagger docs disabled");
  }

  return (
    <section aria-labelledby="settings-api-docs-title">
      <h2 id="settings-api-docs-title">API Docs</h2>
      <p>Control whether Swagger UI and the generated OpenAPI JSON are publicly visible.</p>
      <div className="settings-panel">
        <h3><FileJson aria-hidden="true" size={18} /> Swagger/OpenAPI visibility</h3>
        <p>When disabled, <code>/swagger</code>, <code>/api/swagger</code>, <code>/api/docs</code>, and <code>/api/openapi.json</code> return <code>API_DOCS_DISABLED</code>.</p>
        {!loaded ? (
          <StateMessage title="Loading API docs settings">Loading current Swagger visibility.</StateMessage>
        ) : (
          <>
            <label className={enabled ? "permission-toggle is-allowed" : "permission-toggle"}>
              <input checked={enabled} type="checkbox" onChange={(event) => setEnabled(event.currentTarget.checked)} />
              <strong>{enabled ? "Enabled" : "Disabled"}</strong>
              <span>Show admin control-plane APIs and generated dynamic APIs in Swagger.</span>
              <small>{updatedAt ? `Updated ${new Date(updatedAt).toLocaleString()}` : "Not saved yet"}</small>
            </label>
            <div className="settings-action-row">
              <button type="button" onClick={() => void saveSettings()}><Save aria-hidden="true" size={16} /> Save API docs setting</button>
              <a className="button-secondary" href="/swagger" target="_blank" rel="noreferrer"><ExternalLink aria-hidden="true" size={16} /> Open Swagger</a>
            </div>
          </>
        )}
      </div>
      <StatusToast title="API docs status">{status}</StatusToast>
    </section>
  );
}
