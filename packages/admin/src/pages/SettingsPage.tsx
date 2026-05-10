import { KeyRound, Shield } from "lucide-react";
import { RoleManager } from "../RoleManager";
import type { AdminRoute } from "../app-route.type";
import { SettingsAdminRoles } from "./SettingsAdminRoles";

export function SettingsPage({ route }: { route: AdminRoute }) {
  if (route === "settings/admin-roles") return <SettingsAdminRoles />;
  if (route === "settings/content-roles") return <SettingsContentRoles />;
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
