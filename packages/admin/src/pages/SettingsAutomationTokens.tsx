import { FormEvent, useEffect, useState } from "react";
import { Bot, Clipboard, Plus, Trash2 } from "lucide-react";
import {
  createAutomationToken,
  listAutomationTokens,
  revokeAutomationToken,
} from "../api";
import {
  automationTokenScopes,
  type AutomationTokenRecord,
  type AutomationTokenScope,
} from "../automation-token.type";
import { StateMessage } from "../components/StateMessage";
import { StatusToast } from "../components/StatusToast";

const ttlOptions = [
  { label: "15 minutes", value: 15 },
  { label: "1 hour", value: 60 },
  { label: "1 day", value: 1440 },
];

const scopeLabels: Record<AutomationTokenScope, string> = {
  "permissions:manage": "Permissions",
  "plans:apply": "AI plans",
  "routes:read": "Routes",
  "schemas:manage": "Schemas",
  "workflows:manage": "Workflows",
};

export function SettingsAutomationTokens() {
  const [tokens, setTokens] = useState<AutomationTokenRecord[]>([]);
  const [createdToken, setCreatedToken] = useState("");
  const [status, setStatus] = useState("AI automation tokens loading");

  useEffect(() => {
    void loadTokens();
  }, []);

  async function loadTokens() {
    const result = await listAutomationTokens();
    if (!result.ok) {
      setStatus(result.error ?? "AI automation tokens load failed");
      return;
    }
    setTokens(result.tokens ?? []);
    setStatus("AI automation tokens ready");
  }

  async function submitToken(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const scopes = data.getAll("scope").map(String) as AutomationTokenScope[];
    const result = await createAutomationToken({
      name: String(data.get("name") ?? "") || "Codex setup",
      scopes,
      ttlMinutes: Number(data.get("ttlMinutes") ?? 60),
    });
    if (!result.ok || !result.token) {
      setStatus(result.error ?? "AI automation token create failed");
      return;
    }
    setCreatedToken(result.token);
    form.reset();
    restoreDefaultScopes(form);
    await loadTokens();
    setStatus("AI automation token created");
  }

  async function revoke(tokenId: string) {
    const result = await revokeAutomationToken(tokenId);
    if (!result.ok) {
      setStatus(result.error ?? "AI automation token revoke failed");
      return;
    }
    await loadTokens();
    setStatus("AI automation token revoked");
  }

  async function copyToken() {
    if (!createdToken) return;
    await navigator.clipboard?.writeText(createdToken);
    setStatus("AI automation token copied");
  }

  return (
    <section aria-labelledby="settings-automation-token-title">
      <h2 id="settings-automation-token-title">AI Automation Tokens</h2>
      <p>Temporary tokens for Codex, MCP clients, and AI setup flows.</p>
      <section className="settings-panel role-token-panel" aria-labelledby="automation-token-create-title">
        <h3 id="automation-token-create-title"><Bot aria-hidden="true" size={18} /> Generate token</h3>
        <form className="role-token-form automation-token-form" onSubmit={submitToken}>
          <label>Token name <input name="name" placeholder="Codex setup" /></label>
          <label>Expires
            <select name="ttlMinutes" defaultValue="60">
              {ttlOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <fieldset className="automation-scope-grid">
            <legend>Scopes</legend>
            {automationTokenScopes.map((scope) => (
              <label key={scope}>
                <input name="scope" type="checkbox" value={scope} defaultChecked />
                {scopeLabels[scope]}
              </label>
            ))}
          </fieldset>
          <button type="submit">
            <Plus aria-hidden="true" size={16} />
            Generate token
          </button>
        </form>
        {createdToken ? (
          <div className="role-token-secret" role="status">
            <code>{createdToken}</code>
            <button type="button" onClick={() => void copyToken()} aria-label="Copy AI automation token">
              <Clipboard aria-hidden="true" size={16} />
            </button>
          </div>
        ) : null}
      </section>
      <div className="role-token-list" aria-label="AI automation token list">
        {tokens.length === 0 ? (
          <StateMessage title="No AI automation tokens yet" variant="empty">
            Generate a temporary token when an AI assistant needs to change this project.
          </StateMessage>
        ) : tokens.map((token) => (
          <article className={token.revokedAt ? "role-token-row is-revoked" : "role-token-row"} key={token.id}>
            <div>
              <strong>{token.name}</strong>
              <span>{token.tokenPrefix}... · {token.scopes.map((scope) => scopeLabels[scope]).join(", ")}</span>
            </div>
            <span>{token.revokedAt ? "Revoked" : tokenState(token)}</span>
            <button disabled={Boolean(token.revokedAt)} type="button" onClick={() => void revoke(token.id)}>
              <Trash2 aria-hidden="true" size={16} />
              Revoke
            </button>
          </article>
        ))}
      </div>
      <StatusToast title="AI automation token status">{status}</StatusToast>
    </section>
  );
}

function restoreDefaultScopes(form: HTMLFormElement): void {
  for (const input of form.querySelectorAll<HTMLInputElement>("input[name='scope']")) {
    input.checked = true;
  }
}

function tokenState(token: AutomationTokenRecord): string {
  if (new Date(token.expiresAt).getTime() <= Date.now()) return "Expired";
  return "Active";
}
