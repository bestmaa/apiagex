import { FormEvent, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import {
  createRole,
  listRoles,
} from "./api";
import { StateMessage } from "./components/StateMessage";
import { StatusToast } from "./components/StatusToast";
import type { RoleRecord } from "./role.type";

export function RoleManager() {
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [status, setStatus] = useState("Role manager loading");

  useEffect(() => {
    void loadInitial();
  }, []);

  async function loadInitial() {
    const roleResult = await listRoles();
    if (!roleResult.ok) {
      setStatus(roleResult.error ?? "Content roles failed");
      return;
    }
    setRoles(roleResult.roles ?? []);
    setStatus("Content roles ready");
  }

  async function submitRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const result = await createRole(
      String(data.get("name") ?? ""),
      String(data.get("description") ?? ""),
    );
    if (!result.ok) {
      setStatus(result.error ?? "Role create failed");
      return;
    }
    form.reset();
    const roleResult = await listRoles();
    setRoles(roleResult.roles ?? []);
    setStatus(`Created role: ${result.role?.name ?? "role"}`);
  }

  return (
    <section aria-labelledby="role-manager-title">
      <h2 id="role-manager-title">Roles</h2>
      <p>These are API roles only; owner and admin panel roles are kept separate.</p>
      <p>Configure access rules from <a href="#settings/api-permissions">Settings / API Permissions</a> and create tokens from <a href="#settings/api-tokens">Settings / API Tokens</a>.</p>
      <form onSubmit={submitRole}>
        <label>API role name <input name="name" pattern="[a-z](?:[a-z0-9]|-)*" required /></label>
        <label>API role description <input name="description" /></label>
        <button type="submit">
          <Plus aria-hidden="true" size={16} />
          Create API role
        </button>
      </form>
      {roles.length === 0 ? (
        <StateMessage title="No API roles yet" variant="empty">Create an API role before assigning permissions or tokens.</StateMessage>
      ) : (
        <section className="role-list" aria-labelledby="role-list-title">
          <h3 id="role-list-title">Role list</h3>
          {roles.map((role) => (
            <article className="role-row" key={role.id}>
              <div>
                <strong>{role.name}</strong>
                <span>{role.description || "No description"}</span>
              </div>
              <div className="role-row-badges">
                <span>{role.name === "public" ? "Open API role" : "API role"}</span>
              </div>
              <p>{role.name === "public" ? "Allow this role in API Permissions to make routes public without a token." : "Use this role with API tokens after permissions are saved."}</p>
            </article>
          ))}
        </section>
      )}
      <StatusToast title="Role status">{status}</StatusToast>
    </section>
  );
}
