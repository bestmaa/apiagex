import { FormEvent, useEffect, useState } from "react";
import { Plus, Save } from "lucide-react";
import {
  createRole,
  listRolePermissions,
  listRoles,
  listSchemas,
  saveRolePermissions,
} from "./api";
import { StatusToast } from "./components/StatusToast";
import {
  buildPermissionDrafts,
  PermissionGrid,
  RoleList,
} from "./RolePermissionsPanel";
import type {
  PermissionAction,
  PermissionRecord,
  RoleRecord,
} from "./role.type";
import type { SchemaRecord } from "./schema.type";

export function RoleManager() {
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [schemas, setSchemas] = useState<SchemaRecord[]>([]);
  const [roleId, setRoleId] = useState("");
  const [permissions, setPermissions] = useState<PermissionRecord[]>([]);
  const [status, setStatus] = useState("Role manager loading");

  useEffect(() => {
    void loadInitial();
  }, []);

  async function loadInitial() {
    const roleResult = await listRoles();
    const schemaResult = await listSchemas();
    if (!roleResult.ok || !schemaResult.ok) {
      setStatus(roleResult.error ?? schemaResult.error ?? "Role permissions failed");
      return;
    }
    const nextRoles = roleResult.roles ?? [];
    setRoles(nextRoles);
    setSchemas(schemaResult.schemas ?? []);
    setRoleId(nextRoles[0]?.id ?? "");
    if (nextRoles[0]) await loadPermissions(nextRoles[0].id);
    setStatus("Role permissions ready");
  }

  async function loadPermissions(nextRoleId: string) {
    const result = await listRolePermissions(nextRoleId);
    setPermissions(result.permissions ?? []);
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
    if (result.role) {
      setRoleId(result.role.id);
      await loadPermissions(result.role.id);
    }
    setStatus(`Created role: ${result.role?.name ?? "role"}`);
  }

  async function changeRole(nextRoleId: string) {
    setRoleId(nextRoleId);
    await loadPermissions(nextRoleId);
  }

  async function savePermissions() {
    if (!roleId) {
      setStatus("Create or select a role first");
      return;
    }
    const drafts = buildPermissionDrafts(schemas, permissions);
    const result = await saveRolePermissions(roleId, drafts);
    setPermissions(result.permissions ?? []);
    setStatus(result.ok ? "Permissions saved" : result.error ?? "Save failed");
  }

  function toggle(schemaId: string, action: PermissionAction, allowed: boolean) {
    setPermissions((current) => {
      const exists = current.some((item) => item.schemaId === schemaId && item.action === action);
      if (exists) {
        return current.map((item) =>
          item.schemaId === schemaId && item.action === action ? { ...item, allowed } : item,
        );
      }
      return [...current, { id: `${schemaId}:${action}`, roleId, schemaId, action, allowed }];
    });
  }

  return (
    <section aria-labelledby="role-manager-title">
      <h2 id="role-manager-title">Roles</h2>
      <p>English: Checked actions are allowed for requests sent with that role id.</p>
      <p>Hinglish: Checked actions us role id ke saath bheje gaye requests ke liye allowed hain.</p>
      <p>Unchecked actions are blocked when <code>x-apiagex-role-id</code> is provided. <code>manage</code> allows every action for that schema.</p>
      <form onSubmit={submitRole}>
        <label>Role name <input name="name" pattern="[a-z](?:[a-z0-9]|-)*" required /></label>
        <label>Role description <input name="description" /></label>
        <button type="submit">
          <Plus aria-hidden="true" size={16} />
          Create role
        </button>
      </form>
      <RoleList activeRoleId={roleId} permissions={permissions} roles={roles} schemas={schemas} />
      <label>Active role
        <select value={roleId} onChange={(event) => void changeRole(event.target.value)}>
          <option value="">Select role</option>
          {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
        </select>
      </label>
      <PermissionGrid permissions={permissions} schemas={schemas} toggle={toggle} />
      <button disabled={!roleId || schemas.length === 0} type="button" onClick={() => void savePermissions()}>
        <Save aria-hidden="true" size={16} />
        Save permissions
      </button>
      <StatusToast title="Role status">{status}</StatusToast>
    </section>
  );
}
