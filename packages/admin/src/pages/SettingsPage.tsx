import { KeyRound, Radio, Send, Shield } from "lucide-react";
import { RoleManager } from "../RoleManager";
import type { AdminRoute } from "../app-route.type";
import { SettingsAdminRoles } from "./SettingsAdminRoles";
import { WebhookManager } from "../WebhookManager";
import { RealtimeManager } from "../RealtimeManager";

export function SettingsPage({ route }: { route: AdminRoute }) {
  if (route === "settings/admin-roles") return <SettingsAdminRoles />;
  if (route === "settings/content-roles") return <SettingsContentRoles />;
  if (route === "settings/webhooks") return <SettingsWebhooks />;
  if (route === "settings/realtime") return <SettingsRealtime />;
  return <SettingsOverview />;
}

function SettingsOverview() {
  return (
    <section aria-labelledby="settings-title">
      <h2 id="settings-title">Settings</h2>
      <p>Choose which role system you want to manage.</p>
      <div className="settings-option-grid">
        <a className="settings-option" href="#settings/admin-roles">
          <Shield aria-hidden="true" size={20} />
          <strong>Admin Roles</strong>
          <span>Owner/admin panel roles and Admin UI permissions.</span>
        </a>
        <a className="settings-option" href="#settings/content-roles">
          <KeyRound aria-hidden="true" size={20} />
          <strong>Content Roles</strong>
          <span>Generated content API roles and per-API permissions.</span>
        </a>
        <a className="settings-option" href="#settings/webhooks">
          <Send aria-hidden="true" size={20} />
          <strong>Webhooks</strong>
          <span>Signed content API change notifications.</span>
        </a>
        <a className="settings-option" href="#settings/realtime">
          <Radio aria-hidden="true" size={20} />
          <strong>Realtime API</strong>
          <span>WebSocket events for live client screens.</span>
        </a>
      </div>
    </section>
  );
}

function SettingsContentRoles() {
  return (
    <section aria-labelledby="settings-content-role-title" className="settings-route-panel">
      <h2 id="settings-content-role-title">Content Roles</h2>
      <p>These roles work only with generated <code>/api/content</code> routes.</p>
      <RoleManager />
    </section>
  );
}

function SettingsWebhooks() {
  return (
    <section aria-labelledby="settings-webhook-title" className="settings-route-panel">
      <h2 id="settings-webhook-title">Webhooks</h2>
      <p>Trigger external systems when content entries change.</p>
      <WebhookManager />
    </section>
  );
}

function SettingsRealtime() {
  return (
    <section aria-labelledby="settings-realtime-title" className="settings-route-panel">
      <h2 id="settings-realtime-title">Realtime API</h2>
      <p>Turn on live WebSocket events per generated content API.</p>
      <RealtimeManager />
    </section>
  );
}
