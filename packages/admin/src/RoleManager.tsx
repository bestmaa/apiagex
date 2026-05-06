import { FormEvent, useEffect, useState } from "react";
import { Plus, Save } from "lucide-react";
import {
  createRole,
  listRolePermissions,
  listRoles,
  listSchemas,
  saveRolePermissions,
} from "./api";
import { StateMessage } from "./components/StateMessage";
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
      <p>Unchecked actions are blocked when <code>x-apiagex-role-id</code> is provided.</p>
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
      <button disabled={!roleId || schemas.length === 0} onClick={() => void savePermissions()}>
        <Save aria-hidden="true" size={16} />
        Save permissions
      </button>
      <StateMessage title="Role state">{status}</StateMessage>
    </section>
  );
}

function RoleList({
  activeRoleId,
  permissions,
  roles,
  schemas,
}: {
  activeRoleId: string;
  permissions: PermissionRecord[];
  roles: RoleRecord[];
  schemas: SchemaRecord[];
}) {
  if (roles.length === 0) {
    return <StateMessage title="No roles yet" variant="empty">Create a role to start access setup.</StateMessage>;
  }
  const allowedCount = permissions.filter((permission) => permission.allowed).length;
  const possibleCount = schemas.length * actions.length;
  return (
    <section className="role-list" aria-labelledby="role-list-title">
      <h3>Role list</h3>
      {roles.map((role) => (
        <article className={role.id === activeRoleId ? "role-row is-active" : "role-row"} key={role.id}>
          <div>
            <strong>{role.name}</strong>
            <span>{role.description || "No description"}</span>
          </div>
          <div className="role-row-badges">
            <span>{role.isOwner ? "Owner" : "Custom role"}</span>
            {role.id === activeRoleId ? <span>Active</span> : null}
            <span>{role.id === activeRoleId ? `${allowedCount}/${possibleCount} allowed` : "Select to inspect"}</span>
          </div>
          <p>{role.isOwner ? "Owner can manage Admin UI. Content API requests still use role permission checks." : "Use this role id in API requests after permissions are saved."}</p>
        </article>
      ))}
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
      {props.schemas.length === 0 ? (
        <StateMessage title="No schemas for permissions" variant="empty">
          Create a schema before assigning permissions.
        </StateMessage>
      ) : props.schemas.map((schema) => (
        <fieldset key={schema.id}>
          <legend>{schema.name} API - /api/content/{schema.slug}</legend>
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
