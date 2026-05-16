import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import {
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
import type { PermissionAction, PermissionRecord, RoleRecord } from "./role.type";
import type { SchemaRecord } from "./schema.type";

export function ApiPermissionManager() {
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [schemas, setSchemas] = useState<SchemaRecord[]>([]);
  const [roleId, setRoleId] = useState("");
  const [permissions, setPermissions] = useState<PermissionRecord[]>([]);
  const [status, setStatus] = useState("API permissions loading");

  useEffect(() => {
    void loadInitial();
  }, []);

  async function loadInitial() {
    const roleResult = await listRoles();
    const schemaResult = await listSchemas();
    if (!roleResult.ok || !schemaResult.ok) {
      setStatus(roleResult.error ?? schemaResult.error ?? "API permissions failed");
      return;
    }
    const nextRoles = sortRoles(roleResult.roles ?? []);
    setRoles(nextRoles);
    setSchemas(schemaResult.schemas ?? []);
    const firstRoleId = nextRoles[0]?.id ?? "";
    setRoleId(firstRoleId);
    if (firstRoleId) await loadPermissions(firstRoleId);
    setStatus("API permissions ready");
  }

  async function loadPermissions(nextRoleId: string) {
    const result = await listRolePermissions(nextRoleId);
    setPermissions(result.permissions ?? []);
  }

  async function changeRole(nextRoleId: string) {
    setRoleId(nextRoleId);
    await loadPermissions(nextRoleId);
  }

  async function savePermissions() {
    if (!roleId) {
      setStatus("Create or select an API role first");
      return;
    }
    const drafts = buildPermissionDrafts(schemas, permissions);
    const result = await saveRolePermissions(roleId, drafts);
    setPermissions(result.permissions ?? []);
    const roleName = roles.find((role) => role.id === roleId)?.name ?? "role";
    setStatus(result.ok ? `Saved API permissions for ${roleName}` : result.error ?? "Save failed");
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

  const activeRole = roles.find((role) => role.id === roleId);

  return (
    <section aria-labelledby="api-permission-manager-title">
      <h2 id="api-permission-manager-title">API Permissions</h2>
      <p>All generated content APIs are blocked by default. Allow actions per role and schema here.</p>
      <p>Select <strong>public</strong> to open an API without a token. Leave public blocked when the API must require an API token.</p>
      <RoleList activeRoleId={roleId} permissions={permissions} roles={roles} schemas={schemas} />
      <label>Permission target
        <select value={roleId} onChange={(event) => void changeRole(event.target.value)}>
          <option value="">Select API role</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name === "public" ? "public - open/no token" : role.name}
            </option>
          ))}
        </select>
      </label>
      {activeRole?.name === "public" ? (
        <p className="warning-text">Allowed public actions are reachable without Authorization headers or API tokens.</p>
      ) : null}
      <PermissionGrid permissions={permissions} schemas={schemas} toggle={toggle} />
      <button disabled={!roleId || schemas.length === 0} type="button" onClick={() => void savePermissions()}>
        <Save aria-hidden="true" size={16} />
        Save permissions
      </button>
      <StatusToast title="API permission status">{status}</StatusToast>
    </section>
  );
}

function sortRoles(roles: RoleRecord[]): RoleRecord[] {
  return [...roles].sort((left, right) => {
    if (left.name === "public") return -1;
    if (right.name === "public") return 1;
    return left.name.localeCompare(right.name);
  });
}
