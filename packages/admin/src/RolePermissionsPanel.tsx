import { StateMessage } from "./components/StateMessage";
import type {
  PermissionAction,
  PermissionDraft,
  PermissionRecord,
  RoleRecord,
} from "./role.type";
import type { SchemaRecord } from "./schema.type";

export const permissionActions: PermissionAction[] = [
  "getAll",
  "get",
  "create",
  "update",
  "delete",
  "realtime",
  "manage",
];

const actionHelp = {
  create: "POST create entry",
  delete: "DELETE entry",
  get: "GET one entry",
  getAll: "GET list",
  manage: "Allow all actions",
  realtime: "WebSocket subscribe",
  update: "PATCH/PUT entry",
} satisfies Record<PermissionAction, string>;

export function RoleList(props: {
  activeRoleId: string;
  permissions: PermissionRecord[];
  roles: RoleRecord[];
  schemas: SchemaRecord[];
}) {
  const { activeRoleId, permissions, roles, schemas } = props;
  if (roles.length === 0) {
    return <StateMessage title="No API roles yet" variant="empty">Create an API role to start access setup.</StateMessage>;
  }
  const allowedCount = permissions.filter((permission) => permission.allowed).length;
  const possibleCount = schemas.length * permissionActions.length;
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
            <span>API role</span>
            {role.id === activeRoleId ? <span>Active</span> : null}
            <span>{role.id === activeRoleId ? `${allowedCount}/${possibleCount} allowed` : "Select to inspect"}</span>
          </div>
          {role.id === activeRoleId ? <PermissionSummaryBadges permissions={permissions} /> : null}
          <p>Use this role id in content API requests after permissions are saved.</p>
        </article>
      ))}
    </section>
  );
}

export function PermissionGrid(props: {
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
        <fieldset className="permission-card" key={schema.id}>
          <legend>{schema.name}</legend>
          <code>/api/content/{schema.slug}</code>
          <p className="permission-help">getAll = list API, get = one entry API, realtime = WebSocket subscribe, manage = all actions for this API.</p>
          {permissionActions.map((action) => (
            <PermissionToggle
              action={action}
              allowed={isAllowed(props.permissions, schema.id, action)}
              key={action}
              onChange={(allowed) => props.toggle(schema.id, action, allowed)}
            />
          ))}
        </fieldset>
      ))}
    </div>
  );
}

export function buildPermissionDrafts(
  schemas: SchemaRecord[],
  permissions: PermissionRecord[],
): PermissionDraft[] {
  return schemas.flatMap((schema) =>
    permissionActions.map((action) => ({
      schemaId: schema.id,
      action,
      allowed: isAllowed(permissions, schema.id, action),
    })),
  );
}

function PermissionSummaryBadges({ permissions }: { permissions: PermissionRecord[] }) {
  return (
    <div className="permission-summary-badges" aria-label="Active role permission summary">
      {permissionActions.map((action) => {
        const count = permissions.filter((permission) => permission.action === action && permission.allowed).length;
        return <span key={action}>{action}: {count}</span>;
      })}
    </div>
  );
}

function PermissionToggle({
  action,
  allowed,
  onChange,
}: {
  action: PermissionAction;
  allowed: boolean;
  onChange: (allowed: boolean) => void;
}) {
  return (
    <label className={allowed ? "permission-toggle is-allowed" : "permission-toggle"}>
      <input checked={allowed} type="checkbox" onChange={(event) => onChange(event.target.checked)} />
      <span>{action}</span>
      <small>{actionHelp[action]}</small>
      <strong>{allowed ? "Allowed" : "Blocked"}</strong>
    </label>
  );
}

function isAllowed(
  permissions: PermissionRecord[],
  schemaId: string,
  action: PermissionAction,
): boolean {
  return Boolean(permissions.find((item) => item.schemaId === schemaId && item.action === action)?.allowed);
}
