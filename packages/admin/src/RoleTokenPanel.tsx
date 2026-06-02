import { FormEvent, useEffect, useState } from "react";
import { Clipboard, KeyRound, Plus, Trash2 } from "lucide-react";
import { createApiToken, listApiTokens, revokeApiToken } from "./api";
import { StateMessage } from "./components/StateMessage";
import type { ApiTokenRecord } from "./role.type";

export function RoleTokenPanel({
  onStatus,
  roleId,
  roleName,
}: {
  onStatus: (status: string) => void;
  roleId: string;
  roleName: string;
}) {
  const [tokens, setTokens] = useState<ApiTokenRecord[]>([]);
  const [createdToken, setCreatedToken] = useState("");

  useEffect(() => {
    setCreatedToken("");
    if (!roleId) {
      setTokens([]);
      return;
    }
    void loadTokens(roleId);
  }, [roleId]);

  async function loadTokens(nextRoleId = roleId) {
    const result = await listApiTokens(nextRoleId);
    if (!result.ok) {
      onStatus(result.error ?? "API tokens load failed");
      return;
    }
    setTokens(result.tokens ?? []);
  }

  async function submitToken(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!roleId) {
      onStatus("Select an API role first");
      return;
    }
    const form = event.currentTarget;
    const data = new FormData(form);
    const result = await createApiToken(roleId, String(data.get("name") ?? ""));
    if (!result.ok || !result.token) {
      onStatus(result.error ?? "API token create failed");
      return;
    }
    form.reset();
    setCreatedToken(result.token);
    await loadTokens();
    onStatus(`Created API token for ${roleName || "role"}`);
  }

  async function revoke(tokenId: string) {
    const result = await revokeApiToken(roleId, tokenId);
    if (!result.ok) {
      onStatus(result.error ?? "API token revoke failed");
      return;
    }
    await loadTokens();
    onStatus("API token revoked");
  }

  async function copyToken() {
    if (!createdToken) return;
    await navigator.clipboard?.writeText(createdToken);
    onStatus("API token copied");
  }

  return (
    <section className="settings-panel role-token-panel" aria-labelledby="role-token-title">
      <h3 id="role-token-title"><KeyRound aria-hidden="true" size={18} /> API Tokens</h3>
      <p>Use API tokens for server or partner app calls with <code>Authorization: Bearer TOKEN</code> or <code>x-apiagex-api-token</code>. Content users can also log in with <code>/api/auth/login-user</code>.</p>
      {!roleId ? (
        <StateMessage title="No active API role" variant="empty">Select an API role before creating tokens.</StateMessage>
      ) : (
        <>
          <form className="role-token-form" onSubmit={submitToken}>
            <label>Token name <input name="name" placeholder="Partner app" /></label>
            <button type="submit">
              <Plus aria-hidden="true" size={16} />
              Create token
            </button>
          </form>
          {createdToken ? (
            <div className="role-token-secret" role="status">
              <code>{createdToken}</code>
              <button type="button" onClick={() => void copyToken()} aria-label="Copy API token">
                <Clipboard aria-hidden="true" size={16} />
              </button>
            </div>
          ) : null}
          <div className="role-token-list" aria-label="API token list">
            {tokens.length === 0 ? (
              <StateMessage title="No API tokens yet" variant="empty">Create a token for the selected API role.</StateMessage>
            ) : tokens.map((token) => (
              <article className={token.revokedAt ? "role-token-row is-revoked" : "role-token-row"} key={token.id}>
                <div>
                  <strong>{token.name}</strong>
                  <span>{token.tokenPrefix}...</span>
                </div>
                <span>{token.revokedAt ? "Revoked" : "Active"}</span>
                <button disabled={Boolean(token.revokedAt)} type="button" onClick={() => void revoke(token.id)}>
                  <Trash2 aria-hidden="true" size={16} />
                  Revoke
                </button>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
