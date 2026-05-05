import { ReactNode, useEffect, useState } from "react";
import { listRoles, listSchemas, listUsers } from "./api";
import type { RoleRecord } from "./role.type";
import type { SchemaRecord } from "./schema.type";
import type { UserRecord } from "./user.type";

type DashboardState = {
  schemas: SchemaRecord[];
  roles: RoleRecord[];
  users: UserRecord[];
};

export function DashboardPage({ sessionPanel }: { sessionPanel: ReactNode }) {
  const [state, setState] = useState<DashboardState | null>(null);
  const [status, setStatus] = useState("Loading dashboard");

  useEffect(() => {
    let active = true;
    async function loadDashboard() {
      const [schemaResult, roleResult, userResult] = await Promise.all([
        listSchemas(),
        listRoles(),
        listUsers(),
      ]);
      if (!active) return;
      if (!schemaResult.ok || !roleResult.ok || !userResult.ok) {
        setStatus(schemaResult.error ?? roleResult.error ?? userResult.error ?? "Dashboard load failed");
        return;
      }
      setState({
        schemas: schemaResult.schemas ?? [],
        roles: roleResult.roles ?? [],
        users: userResult.users ?? [],
      });
      setStatus("Dashboard ready");
    }
    loadDashboard().catch(() => {
      if (active) setStatus("Dashboard load failed");
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <section className="summary-panel">
        <h2>Dashboard</h2>
        <p>English: Monitor schemas, generated APIs, roles, and users from one place.</p>
        <p>Hinglish: Schemas, generated APIs, roles, aur users ek jagah se monitor karo.</p>
      </section>
      {sessionPanel}
      <section>
        <h2>Workspace Summary</h2>
        <p className="status-line">{status}</p>
        {state ? <DashboardSummary state={state} /> : null}
      </section>
    </>
  );
}

function DashboardSummary({ state }: { state: DashboardState }) {
  return (
    <>
      <div className="field-list">
        <p className="status-line">Schemas: {state.schemas.length}</p>
        <p className="status-line">Generated APIs: {state.schemas.length}</p>
        <p className="status-line">Roles: {state.roles.length}</p>
        <p className="status-line">Users: {state.users.length}</p>
      </div>
      <QuickLinks />
      <RecentSchemas schemas={state.schemas} />
    </>
  );
}

function QuickLinks() {
  return (
    <div className="api-row">
      <strong>Quick actions</strong>
      <ul>
        <li><a href="#schemas">Create schema</a></li>
        <li><a href="#roles">Create role</a></li>
        <li><a href="#users">Create user</a></li>
      </ul>
    </div>
  );
}

function RecentSchemas({ schemas }: { schemas: SchemaRecord[] }) {
  const recentSchemas = schemas.slice(-3).reverse();
  if (recentSchemas.length === 0) {
    return <p className="empty-state">No schemas yet. Create a schema to generate the first API.</p>;
  }
  return (
    <div className="field-list">
      <h3>Recent schemas</h3>
      {recentSchemas.map((schema) => (
        <div className="api-row" key={schema.id}>
          <strong>{schema.name}</strong>
          <code>/api/content/{schema.slug}</code>
        </div>
      ))}
    </div>
  );
}
