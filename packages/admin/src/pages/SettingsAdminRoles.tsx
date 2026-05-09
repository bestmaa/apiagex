import { FormEvent, useEffect, useState } from "react";
import { KeyRound, Save, Shield, SlidersHorizontal } from "lucide-react";
import {
  createAdminRole,
  listAccessSettings,
  listAdminRolePermissions,
  saveAdminRolePermissions,
} from "../api";
import { StatusToast } from "../components/StatusToast";
import type { RoleRecord } from "../role.type";
import type {
  AdminPermissionAction,
  AdminPermissionDraft,
  AdminPermissionRecord,
} from "../settings.type";

const adminActions: AdminPermissionAction[] = [
  "schemas",
  "entries",
  "apiRoles",
  "apiUsers",
  "settings",
];

const actionText = {
  apiRoles: ["API roles", "Create API roles and save generated API permissions."],
  apiUsers: ["API users", "Create content API users and assign API roles."],
  entries: ["Entries", "Create and edit Admin UI content entries."],
  schemas: ["Schemas", "Create schemas, fields, and generated APIs."],
  settings: ["Settings", "Manage control-plane access settings."],
} satisfies Record<AdminPermissionAction, [string, string]>;

export function SettingsAdminRoles() {
  const [adminRoles, setAdminRoles] = useState<RoleRecord[]>([]);
  const [activeRoleId, setActiveRoleId] = useState("");
  const [permissions, setPermissions] = useState<AdminPermissionRecord[]>([]);
  const [status, setStatus] = useState("Admin roles loading");

  useEffect(() => {
    void loadSettings();
  }, []);

  async function loadSettings(nextActiveRoleId?: string) {
    const result = await listAccessSettings();
    if (!result.ok) {
      setStatus(result.error ?? "Admin roles load failed");
      return;
    }
    const nextAdminRoles = result.adminRoles ?? [];
    const nextRoleId = nextActiveRoleId || activeRoleId || nextAdminRoles[0]?.id || "";
    setAdminRoles(nextAdminRoles);
    setActiveRoleId(nextRoleId);
    if (nextRoleId) await loadPermissions(nextRoleId);
    setStatus("Admin roles ready");
  }

  async function loadPermissions(roleId: string) {
    const result = await listAdminRolePermissions(roleId);
    setPermissions(result.permissions ?? []);
    if (!result.ok) setStatus(result.error ?? "Admin permissions failed");
  }

  async function submitAdminRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const result = await createAdminRole(
      String(data.get("name") ?? ""),
      String(data.get("description") ?? ""),
    );
    if (!result.ok || !result.role) {
      setStatus(result.error ?? "Admin role create failed");
      return;
    }
    form.reset();
    await loadSettings(result.role.id);
    setStatus(`Created admin role: ${result.role.name}`);
  }

  async function changeRole(roleId: string) {
    setActiveRoleId(roleId);
    await loadPermissions(roleId);
  }

  async function savePermissions() {
    const activeRole = adminRoles.find((role) => role.id === activeRoleId);
    if (!activeRole || activeRole.isOwner) return;
    const result = await saveAdminRolePermissions(activeRole.id, buildDrafts(permissions));
    setPermissions(result.permissions ?? []);
    setStatus(result.ok ? "Admin permissions saved" : result.error ?? "Save failed");
  }

  function toggle(action: AdminPermissionAction, allowed: boolean) {
    setPermissions((current) => upsertPermission(current, activeRoleId, action, allowed));
  }

  const activeRole = adminRoles.find((role) => role.id === activeRoleId);

  return (
    <section aria-labelledby="settings-admin-role-title">
      <h2 id="settings-admin-role-title">Admin Roles</h2>
      <p>English: Admin panel roles and content API roles stay separate.</p>
      <p>Hinglish: Admin panel roles aur content API roles alag-alag rahenge.</p>
      <div className="settings-access-layout">
        <AdminRoleSection
          activeRole={activeRole}
          adminRoles={adminRoles}
          onChangeRole={(roleId) => void changeRole(roleId)}
          onCreateRole={(event) => void submitAdminRole(event)}
        />
        <AdminPermissionSection
          activeRole={activeRole}
          onSave={() => void savePermissions()}
          onToggle={toggle}
          permissions={permissions}
        />
      </div>
      <StatusToast title="Admin role status">{status}</StatusToast>
    </section>
  );
}

function AdminRoleSection(props: {
  activeRole: RoleRecord | undefined;
  adminRoles: RoleRecord[];
  onChangeRole: (roleId: string) => void;
  onCreateRole: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <section className="settings-panel" aria-labelledby="admin-role-title">
      <h3 id="admin-role-title"><Shield aria-hidden="true" size={18} /> Admin Panel Roles</h3>
      <p>Owner/admin roles control Admin UI areas only and cannot unlock content APIs.</p>
      <form onSubmit={props.onCreateRole}>
        <label>Admin role name <input name="name" pattern="[a-z](?:[a-z0-9]|-)*" required /></label>
        <label>Admin role description <input name="description" /></label>
        <button type="submit"><KeyRound aria-hidden="true" size={16} /> Create admin role</button>
      </form>
      <label>Active admin role
        <select value={props.activeRole?.id ?? ""} onChange={(event) => props.onChangeRole(event.target.value)}>
          {props.adminRoles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
        </select>
      </label>
      <div className="role-list">
        {props.adminRoles.map((role) => <AdminRoleRow active={role.id === props.activeRole?.id} key={role.id} role={role} />)}
      </div>
    </section>
  );
}

function AdminRoleRow({ active, role }: { active: boolean; role: RoleRecord }) {
  return (
    <article className={active ? "role-row is-active" : "role-row"}>
      <div><strong>{role.name}</strong><span>{role.description || "No description"}</span></div>
      <div className="role-row-badges">
        <span>{role.isOwner ? "Owner locked" : "Admin panel role"}</span>
        {active ? <span>Active</span> : null}
      </div>
      <p>{role.isOwner ? "Owner has every admin permission." : "Saved permissions stay separate from generated API access."}</p>
    </article>
  );
}

function AdminPermissionSection(props: {
  activeRole: RoleRecord | undefined;
  permissions: AdminPermissionRecord[];
  onToggle: (action: AdminPermissionAction, allowed: boolean) => void;
  onSave: () => void;
}) {
  const locked = !props.activeRole || props.activeRole.isOwner;
  return (
    <section className="settings-panel" aria-labelledby="admin-permission-title">
      <h3 id="admin-permission-title"><SlidersHorizontal aria-hidden="true" size={18} /> Admin Permissions</h3>
      <p>{locked ? "Owner is locked with all admin permissions." : "Checked admin areas are allowed for this admin role."}</p>
      <div className="permission-grid">
        {adminActions.map((action) => (
          <label className={isAllowed(props.permissions, action) ? "permission-toggle is-allowed" : "permission-toggle"} key={action}>
            <input checked={isAllowed(props.permissions, action)} disabled={locked} type="checkbox" onChange={(event) => props.onToggle(action, event.target.checked)} />
            <span>{actionText[action][0]}</span>
            <small>{actionText[action][1]}</small>
            <strong>{isAllowed(props.permissions, action) ? "Allowed" : "Blocked"}</strong>
          </label>
        ))}
      </div>
      <button disabled={locked} type="button" onClick={props.onSave}>
        <Save aria-hidden="true" size={16} /> Save admin permissions
      </button>
    </section>
  );
}

function buildDrafts(permissions: AdminPermissionRecord[]): AdminPermissionDraft[] {
  return adminActions.map((action) => ({ action, allowed: isAllowed(permissions, action) }));
}

function isAllowed(permissions: AdminPermissionRecord[], action: AdminPermissionAction): boolean {
  return Boolean(permissions.find((permission) => permission.action === action)?.allowed);
}

function upsertPermission(
  permissions: AdminPermissionRecord[],
  roleId: string,
  action: AdminPermissionAction,
  allowed: boolean,
): AdminPermissionRecord[] {
  if (permissions.some((permission) => permission.action === action)) {
    return permissions.map((permission) =>
      permission.action === action ? { ...permission, allowed } : permission,
    );
  }
  return [...permissions, { id: `${roleId}:${action}`, roleId, action, allowed }];
}
