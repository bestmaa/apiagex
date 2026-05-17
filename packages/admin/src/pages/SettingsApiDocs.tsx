import { ExternalLink, FileJson, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { getApiDocsSettings, saveApiDocsSettings } from "../api";
import { StateMessage } from "../components/StateMessage";
import { StatusToast } from "../components/StatusToast";

export function SettingsApiDocs() {
  const [adminEnabled, setAdminEnabled] = useState(false);
  const [contentEnabled, setContentEnabled] = useState(false);
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
    setAdminEnabled(result.settings.adminEnabled);
    setContentEnabled(result.settings.contentEnabled);
    setUpdatedAt(result.settings.updatedAt);
    setStatus("API docs settings ready");
    setLoaded(true);
  }

  async function saveSettings() {
    setStatus("Saving API docs settings");
    const result = await saveApiDocsSettings({ adminEnabled, contentEnabled });
    if (!result.ok || !result.settings) {
      setStatus(result.error ?? "API docs settings failed");
      return;
    }
    setAdminEnabled(result.settings.adminEnabled);
    setContentEnabled(result.settings.contentEnabled);
    setUpdatedAt(result.settings.updatedAt);
    setStatus(result.settings.adminEnabled || result.settings.contentEnabled ? "Swagger docs enabled" : "Swagger docs disabled");
  }

  return (
    <section aria-labelledby="settings-api-docs-title">
      <h2 id="settings-api-docs-title">API Docs</h2>
      <p>Control whether Swagger UI and the generated OpenAPI JSON are publicly visible.</p>
      <div className="settings-panel">
        <h3><FileJson aria-hidden="true" size={18} /> Swagger/OpenAPI visibility</h3>
        <p>Swagger opens when at least one section is enabled. The OpenAPI JSON includes only the enabled section.</p>
        {!loaded ? (
          <StateMessage title="Loading API docs settings">Loading current Swagger visibility.</StateMessage>
        ) : (
          <>
            <label className={contentEnabled ? "permission-toggle is-allowed" : "permission-toggle"}>
              <input checked={contentEnabled} type="checkbox" onChange={(event) => setContentEnabled(event.currentTarget.checked)} />
              <strong>Content APIs</strong>
              <span>Show generated <code>/api/content</code> routes for every collection.</span>
              <small>{updatedAt ? `Updated ${new Date(updatedAt).toLocaleString()}` : "Not saved yet"}</small>
            </label>
            <label className={adminEnabled ? "permission-toggle is-allowed" : "permission-toggle"}>
              <input checked={adminEnabled} type="checkbox" onChange={(event) => setAdminEnabled(event.currentTarget.checked)} />
              <strong>Admin APIs</strong>
              <span>Show control-plane routes for schemas, entries, roles, users, settings, webhooks, and realtime.</span>
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
