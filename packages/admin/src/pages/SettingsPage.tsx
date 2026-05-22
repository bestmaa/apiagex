import { Bot, FileJson, GitBranch, KeyRound, Radio, Route, Send, Shield, SlidersHorizontal, Ticket } from "lucide-react";
import { ApiPermissionManager } from "../ApiPermissionManager";
import { CustomApiPermissionManager } from "../CustomApiPermissionManager";
import { RoleManager } from "../RoleManager";
import type { AdminRoute } from "../app-route.type";
import { SettingsAutomationTokens } from "./SettingsAutomationTokens";
import { SettingsApiTokens } from "./SettingsApiTokens";
import { SettingsApiDocs } from "./SettingsApiDocs";
import { SettingsAdminRoles } from "./SettingsAdminRoles";
import { WebhookManager } from "../WebhookManager";
import { RealtimeManager } from "../RealtimeManager";
import { WorkflowManager } from "../WorkflowManager";

export function SettingsPage({ route }: { route: AdminRoute }) {
  if (route === "settings/admin-roles") return <SettingsAdminRoles />;
  if (route === "settings/content-roles") return <SettingsContentRoles />;
  if (route === "settings/api-permissions") return <SettingsApiPermissions />;
  if (route === "settings/custom-api-permissions") return <SettingsCustomApiPermissions />;
  if (route === "settings/api-tokens") return <SettingsApiTokens />;
  if (route === "settings/automation-tokens") return <SettingsAutomationTokens />;
  if (route === "settings/api-docs") return <SettingsApiDocs />;
  if (route === "settings/webhooks") return <SettingsWebhooks />;
  if (route === "settings/realtime") return <SettingsRealtime />;
  if (route === "settings/workflows") return <SettingsWorkflows />;
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
          <span>Create generated content API roles.</span>
        </a>
        <a className="settings-option" href="#settings/api-permissions">
          <SlidersHorizontal aria-hidden="true" size={20} />
          <strong>API Permissions</strong>
          <span>Allow, block, or open generated APIs per role.</span>
        </a>
        <a className="settings-option" href="#settings/custom-api-permissions">
          <Route aria-hidden="true" size={20} />
          <strong>Custom API Permissions</strong>
          <span>Allow, block, or open custom business APIs per role.</span>
        </a>
        <a className="settings-option" href="#settings/api-tokens">
          <Ticket aria-hidden="true" size={20} />
          <strong>API Tokens</strong>
          <span>Create and revoke tokens for content API roles.</span>
        </a>
        <a className="settings-option" href="#settings/automation-tokens">
          <Bot aria-hidden="true" size={20} />
          <strong>AI Automation Tokens</strong>
          <span>Create temporary tokens for Codex and MCP setup.</span>
        </a>
        <a className="settings-option" href="#settings/api-docs">
          <FileJson aria-hidden="true" size={20} />
          <strong>API Docs</strong>
          <span>Publish Swagger UI and OpenAPI JSON when needed.</span>
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
        <a className="settings-option" href="#settings/workflows">
          <GitBranch aria-hidden="true" size={20} />
          <strong>Workflows</strong>
          <span>Build no-code custom APIs with safe workflow steps.</span>
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

function SettingsApiPermissions() {
  return (
    <section aria-labelledby="settings-api-permission-title" className="settings-route-panel">
      <h2 id="settings-api-permission-title">API Permissions</h2>
      <p>Decide which generated APIs require tokens and which APIs are open.</p>
      <ApiPermissionManager />
    </section>
  );
}

function SettingsCustomApiPermissions() {
  return (
    <section aria-labelledby="settings-custom-api-permission-title" className="settings-route-panel">
      <h2 id="settings-custom-api-permission-title">Custom API Permissions</h2>
      <p>Decide which custom APIs require tokens and which custom APIs are open.</p>
      <CustomApiPermissionManager />
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

function SettingsWorkflows() {
  return (
    <section aria-labelledby="settings-workflow-title" className="settings-route-panel">
      <h2 id="settings-workflow-title">Workflows</h2>
      <p>Create no-code custom APIs under <code>/api/custom</code>.</p>
      <WorkflowManager />
    </section>
  );
}
