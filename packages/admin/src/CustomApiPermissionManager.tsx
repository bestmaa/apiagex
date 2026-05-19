import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import {
  listCustomApiPermissions,
  listCustomApiRoutes,
  listRoles,
  saveCustomApiPermissions,
} from "./api";
import { StateMessage } from "./components/StateMessage";
import { StatusToast } from "./components/StatusToast";
import type {
  CustomApiPermissionRecord,
  CustomApiRouteRecord,
} from "./custom-api.type";
import type { RoleRecord } from "./role.type";

export function CustomApiPermissionManager() {
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [routes, setRoutes] = useState<CustomApiRouteRecord[]>([]);
  const [roleId, setRoleId] = useState("");
  const [permissions, setPermissions] = useState<CustomApiPermissionRecord[]>([]);
  const [status, setStatus] = useState("Custom API permissions loading");

  useEffect(() => {
    void loadInitial();
  }, []);

  async function loadInitial() {
    const roleResult = await listRoles();
    const routeResult = await listCustomApiRoutes();
    if (!roleResult.ok || !routeResult.ok) {
      setStatus(roleResult.error ?? routeResult.error ?? "Custom API permissions failed");
      return;
    }
    const nextRoles = sortRoles(roleResult.roles ?? []);
    setRoles(nextRoles);
    setRoutes(sortRoutes(routeResult.routes ?? []));
    const firstRoleId = nextRoles[0]?.id ?? "";
    setRoleId(firstRoleId);
    if (firstRoleId) await loadPermissions(firstRoleId);
    setStatus("Custom API permissions ready");
  }

  async function loadPermissions(nextRoleId: string) {
    const result = await listCustomApiPermissions(nextRoleId);
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
    const result = await saveCustomApiPermissions(roleId, routes.map((route) => ({
      customApiRouteId: route.id,
      allowed: isAllowed(permissions, route.id),
    })));
    setPermissions(result.permissions ?? []);
    const roleName = roles.find((role) => role.id === roleId)?.name ?? "role";
    setStatus(result.ok ? `Saved custom API permissions for ${roleName}` : result.error ?? "Save failed");
  }

  function toggle(customApiRouteId: string, allowed: boolean) {
    setPermissions((current) => {
      const exists = current.some((item) => item.customApiRouteId === customApiRouteId);
      if (exists) {
        return current.map((item) =>
          item.customApiRouteId === customApiRouteId ? { ...item, allowed } : item,
        );
      }
      return [...current, { id: `${roleId}:${customApiRouteId}`, roleId, customApiRouteId, allowed }];
    });
  }

  const activeRole = roles.find((role) => role.id === roleId);

  return (
    <section aria-labelledby="custom-api-permission-title">
      <h2 id="custom-api-permission-title">Custom API Permissions</h2>
      <p>Project custom routes are mounted under <code>/api/custom</code> and blocked by default. Allow a role here before clients can call them.</p>
      <p>Select <strong>public</strong> to open a custom API without a token.</p>
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
        <p className="warning-text">Allowed public custom APIs are reachable without Authorization headers or API tokens.</p>
      ) : null}
      <CustomApiGrid permissions={permissions} routes={routes} toggle={toggle} />
      <button disabled={!roleId || routes.length === 0} type="button" onClick={() => void savePermissions()}>
        <Save aria-hidden="true" size={16} />
        Save custom API permissions
      </button>
      <StatusToast title="Custom API permission status">{status}</StatusToast>
    </section>
  );
}

function CustomApiGrid(props: {
  permissions: CustomApiPermissionRecord[];
  routes: CustomApiRouteRecord[];
  toggle: (customApiRouteId: string, allowed: boolean) => void;
}) {
  if (props.routes.length === 0) {
    return (
      <StateMessage title="No custom APIs found" variant="empty">
        Add routes in custom code and restart the server to discover them.
      </StateMessage>
    );
  }
  return (
    <div className="permission-grid">
      {props.routes.map((route) => (
        <fieldset className={route.active ? "permission-card" : "permission-card is-muted"} key={route.id}>
          <legend>{route.name}</legend>
          <code>{route.method} {route.path}</code>
          <p className="permission-help">{route.groupName} group · {route.permissionKey}</p>
          <label className={isAllowed(props.permissions, route.id) ? "permission-toggle is-allowed" : "permission-toggle"}>
            <input
              checked={isAllowed(props.permissions, route.id)}
              disabled={!route.active}
              type="checkbox"
              onChange={(event) => props.toggle(route.id, event.target.checked)}
            />
            <span>access</span>
            <small>{route.active ? "Allow this role to call this custom API." : "Route not seen on last server start."}</small>
            <strong>{isAllowed(props.permissions, route.id) ? "Allowed" : "Blocked"}</strong>
          </label>
        </fieldset>
      ))}
    </div>
  );
}

function sortRoles(roles: RoleRecord[]): RoleRecord[] {
  return [...roles].sort((left, right) => {
    if (left.name === "public") return -1;
    if (right.name === "public") return 1;
    return left.name.localeCompare(right.name);
  });
}

function sortRoutes(routes: CustomApiRouteRecord[]): CustomApiRouteRecord[] {
  return [...routes].sort((left, right) =>
    Number(right.active) - Number(left.active)
    || left.groupName.localeCompare(right.groupName)
    || left.path.localeCompare(right.path)
    || left.method.localeCompare(right.method),
  );
}

function isAllowed(permissions: CustomApiPermissionRecord[], customApiRouteId: string): boolean {
  return Boolean(permissions.find((item) => item.customApiRouteId === customApiRouteId)?.allowed);
}
