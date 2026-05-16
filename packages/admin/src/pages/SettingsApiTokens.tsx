import { useEffect, useState } from "react";
import { listRoles } from "../api";
import { RoleTokenPanel } from "../RoleTokenPanel";
import { StateMessage } from "../components/StateMessage";
import { StatusToast } from "../components/StatusToast";
import type { RoleRecord } from "../role.type";

export function SettingsApiTokens() {
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [roleId, setRoleId] = useState("");
  const [status, setStatus] = useState("API token settings loading");

  useEffect(() => {
    void loadRoles();
  }, []);

  async function loadRoles() {
    const result = await listRoles();
    if (!result.ok) {
      setStatus(result.error ?? "API roles failed");
      return;
    }
    const nextRoles = result.roles ?? [];
    setRoles(nextRoles);
    setRoleId(nextRoles[0]?.id ?? "");
    setStatus(nextRoles.length ? "API token settings ready" : "Create a content role before creating tokens");
  }

  const activeRole = roles.find((role) => role.id === roleId);

  return (
    <section aria-labelledby="settings-api-token-title">
      <h2 id="settings-api-token-title">API Tokens</h2>
      <p>Create tokens for content API roles. Tokens are separate from owner and control admin users.</p>
      {roles.length === 0 ? (
        <StateMessage title="No content roles yet" variant="empty">
          Create a content role before creating API tokens.
        </StateMessage>
      ) : (
        <>
          <label>Content role
            <select value={roleId} onChange={(event) => setRoleId(event.target.value)}>
              {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
            </select>
          </label>
          <RoleTokenPanel
            onStatus={setStatus}
            roleId={roleId}
            roleName={activeRole?.name ?? ""}
          />
        </>
      )}
      <StatusToast title="API token status">{status}</StatusToast>
    </section>
  );
}
