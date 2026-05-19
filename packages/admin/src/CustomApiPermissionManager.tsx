import { useEffect, useMemo, useState } from "react";
import { History, Save, Search, Trash2 } from "lucide-react";
import {
  deleteCustomApiRoute,
  listCustomApiPermissionHistory,
  listCustomApiPermissions,
  listCustomApiRoutes,
  listRoles,
  saveCustomApiPermissions,
  updateCustomApiRoute,
} from "./api";
import { StateMessage } from "./components/StateMessage";
import { StatusToast } from "./components/StatusToast";
import type {
  CustomApiPermissionEventRecord,
  CustomApiPermissionRecord,
  CustomApiRouteRecord,
} from "./custom-api.type";
import type { RoleRecord } from "./role.type";

export function CustomApiPermissionManager() {
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [routes, setRoutes] = useState<CustomApiRouteRecord[]>([]);
  const [roleId, setRoleId] = useState("");
  const [permissions, setPermissions] = useState<CustomApiPermissionRecord[]>([]);
  const [routeDrafts, setRouteDrafts] = useState<Record<string, { groupName: string; name: string }>>({});
  const [history, setHistory] = useState<Record<string, CustomApiPermissionEventRecord[]>>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
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
    setSortedRoutes(routeResult.routes ?? []);
    const firstRoleId = nextRoles[0]?.id ?? "";
    setRoleId(firstRoleId);
    if (firstRoleId) await loadPermissions(firstRoleId);
    setStatus("Custom API permissions ready");
  }

  function setSortedRoutes(nextRoutes: CustomApiRouteRecord[]) {
    const sorted = sortRoutes(nextRoutes);
    setRoutes(sorted);
    setRouteDrafts(Object.fromEntries(sorted.map((route) => [
      route.id,
      { groupName: route.groupName, name: route.name },
    ])));
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

  async function saveRouteDetails(route: CustomApiRouteRecord) {
    const draft = routeDrafts[route.id] ?? { groupName: route.groupName, name: route.name };
    const result = await updateCustomApiRoute(route.id, draft);
    if (result.ok && result.route) {
      setSortedRoutes(routes.map((item) => item.id === route.id ? result.route as CustomApiRouteRecord : item));
      setStatus(`Saved route details for ${result.route.name}`);
      return;
    }
    setStatus(result.error ?? "Route detail save failed");
  }

  async function deleteInactiveRoute(route: CustomApiRouteRecord) {
    const result = await deleteCustomApiRoute(route.id);
    if (result.ok) {
      setSortedRoutes(routes.filter((item) => item.id !== route.id));
      setPermissions((current) => current.filter((item) => item.customApiRouteId !== route.id));
      setStatus(`Deleted inactive custom API ${route.path}`);
      return;
    }
    setStatus(result.error ?? "Inactive route delete failed");
  }

  async function showHistory(route: CustomApiRouteRecord) {
    const result = await listCustomApiPermissionHistory(route.id);
    if (result.ok) {
      setHistory((current) => ({ ...current, [route.id]: result.events ?? [] }));
      setStatus(`Loaded permission history for ${route.name}`);
      return;
    }
    setStatus(result.error ?? "History load failed");
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

  function updateRouteDraft(routeId: string, field: "groupName" | "name", value: string) {
    setRouteDrafts((current) => ({
      ...current,
      [routeId]: {
        groupName: current[routeId]?.groupName ?? "",
        name: current[routeId]?.name ?? "",
        [field]: value,
      },
    }));
  }

  const activeRole = roles.find((role) => role.id === roleId);
  const filteredRoutes = useMemo(
    () => filterRoutes(routes, search, statusFilter),
    [routes, search, statusFilter],
  );

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
      <div className="entry-table-toolbar">
        <label className="entry-search-field">Find custom API
          <span>
            <Search aria-hidden="true" size={16} />
            <input
              placeholder="Search method, path, label, group, or permission key"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </span>
        </label>
        <label>Status
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All routes</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
      </div>
      <CustomApiGrid
        deleteInactiveRoute={deleteInactiveRoute}
        history={history}
        permissions={permissions}
        routeDrafts={routeDrafts}
        routes={filteredRoutes}
        saveRouteDetails={saveRouteDetails}
        showHistory={showHistory}
        toggle={toggle}
        updateRouteDraft={updateRouteDraft}
      />
      <button disabled={!roleId || routes.length === 0} type="button" onClick={() => void savePermissions()}>
        <Save aria-hidden="true" size={16} />
        Save custom API permissions
      </button>
      <StatusToast title="Custom API permission status">{status}</StatusToast>
    </section>
  );
}

function CustomApiGrid(props: {
  deleteInactiveRoute: (route: CustomApiRouteRecord) => Promise<void>;
  history: Record<string, CustomApiPermissionEventRecord[]>;
  permissions: CustomApiPermissionRecord[];
  routeDrafts: Record<string, { groupName: string; name: string }>;
  routes: CustomApiRouteRecord[];
  saveRouteDetails: (route: CustomApiRouteRecord) => Promise<void>;
  showHistory: (route: CustomApiRouteRecord) => Promise<void>;
  toggle: (customApiRouteId: string, allowed: boolean) => void;
  updateRouteDraft: (routeId: string, field: "groupName" | "name", value: string) => void;
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
      {props.routes.map((route) => {
        const draft = props.routeDrafts[route.id] ?? { groupName: route.groupName, name: route.name };
        const events = props.history[route.id];
        return (
          <fieldset className={route.active ? "permission-card" : "permission-card is-muted"} key={route.id}>
            <legend>{route.name}</legend>
            <code>{route.method} {route.path}</code>
            <p className="permission-help">{route.groupName} group · {route.permissionKey}</p>
            <div className="custom-api-route-editor">
              <label>Label
                <input
                  value={draft.name}
                  onChange={(event) => props.updateRouteDraft(route.id, "name", event.target.value)}
                />
              </label>
              <label>Group
                <input
                  value={draft.groupName}
                  onChange={(event) => props.updateRouteDraft(route.id, "groupName", event.target.value)}
                />
              </label>
              <button type="button" onClick={() => void props.saveRouteDetails(route)}>
                <Save aria-hidden="true" size={16} />
                Save details
              </button>
            </div>
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
            <div className="custom-api-route-actions">
              <button type="button" onClick={() => void props.showHistory(route)}>
                <History aria-hidden="true" size={16} />
                View history
              </button>
              {!route.active ? (
                <button className="danger-button" type="button" onClick={() => void props.deleteInactiveRoute(route)}>
                  <Trash2 aria-hidden="true" size={16} />
                  Delete inactive
                </button>
              ) : null}
            </div>
            {events ? <CustomApiHistory events={events} /> : null}
          </fieldset>
        );
      })}
    </div>
  );
}

function CustomApiHistory(props: { events: CustomApiPermissionEventRecord[] }) {
  if (props.events.length === 0) {
    return <p className="permission-help">No allow/block history for this custom API yet.</p>;
  }
  return (
    <div className="custom-api-history">
      <h3>Permission history</h3>
      <ul>
        {props.events.map((event) => (
          <li key={event.id}>
            <strong>{event.allowed ? "Allowed" : "Blocked"}</strong>
            <span>{event.actorEmail}</span>
            <time dateTime={event.createdAt}>{new Date(event.createdAt).toLocaleString()}</time>
          </li>
        ))}
      </ul>
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

function filterRoutes(routes: CustomApiRouteRecord[], search: string, statusFilter: string): CustomApiRouteRecord[] {
  const normalized = search.trim().toLowerCase();
  return routes.filter((route) => {
    const statusMatches = statusFilter === "all"
      || (statusFilter === "active" && route.active)
      || (statusFilter === "inactive" && !route.active);
    if (!statusMatches) return false;
    if (!normalized) return true;
    return [
      route.groupName,
      route.method,
      route.name,
      route.path,
      route.permissionKey,
    ].some((value) => value.toLowerCase().includes(normalized));
  });
}
