import { FormEvent, useEffect, useState } from "react";
import {
  createRole,
  listRolePermissions,
  listRoles,
  listSchemas,
  saveRolePermissions,
} from "./api";
import type {
  PermissionAction,
  PermissionDraft,
  PermissionRecord,
  RoleRecord,
} from "./role.type";
import type { SchemaRecord } from "./schema.type";

const actions: PermissionAction[] = ["read", "create", "update", "delete", "manage"];

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
    await loadInitial();
    setStatus(`Created role: ${result.role?.name ?? "role"}`);
  }

  async function changeRole(nextRoleId: string) {
    setRoleId(nextRoleId);
    await loadPermissions(nextRoleId);
  }

  async function savePermissions() {
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
      <h2 id="role-manager-title">Role Permissions</h2>
      <form onSubmit={submitRole}>
        <label>Role name <input name="name" pattern="[a-z][a-z0-9-]*" required /></label>
        <label>Role description <input name="description" /></label>
        <button type="submit">Create role</button>
      </form>
      <label>Active role
        <select value={roleId} onChange={(event) => void changeRole(event.target.value)}>
          {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
        </select>
      </label>
      <PermissionGrid permissions={permissions} schemas={schemas} toggle={toggle} />
      <button disabled={!roleId || schemas.length === 0} onClick={() => void savePermissions()}>
        Save permissions
      </button>
      <p>{status}</p>
    </section>
  );
}

function PermissionGrid(props: {
  permissions: PermissionRecord[];
  schemas: SchemaRecord[];
  toggle: (schemaId: string, action: PermissionAction, allowed: boolean) => void;
}) {
  return (
    <div className="permission-grid">
      {props.schemas.map((schema) => (
        <fieldset key={schema.id}>
          <legend>{schema.name} API</legend>
          {actions.map((action) => (
            <label key={action}>
              <input
                checked={isAllowed(props.permissions, schema.id, action)}
                type="checkbox"
                onChange={(event) => props.toggle(schema.id, action, event.target.checked)}
              />
              {action}
            </label>
          ))}
        </fieldset>
      ))}
    </div>
  );
}

function buildPermissionDrafts(
  schemas: SchemaRecord[],
  permissions: PermissionRecord[],
): PermissionDraft[] {
  return schemas.flatMap((schema) =>
    actions.map((action) => ({
      schemaId: schema.id,
      action,
      allowed: isAllowed(permissions, schema.id, action),
    })),
  );
}

function isAllowed(
  permissions: PermissionRecord[],
  schemaId: string,
  action: PermissionAction,
): boolean {
  return Boolean(permissions.find((item) => item.schemaId === schemaId && item.action === action)?.allowed);
}
