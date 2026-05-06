import { ReactNode, useEffect, useState } from "react";
import { BookOpen, Database, FileText, KeyRound, Network, Users } from "lucide-react";
import { listEntries, listRoles, listSchemas, listUsers } from "./api";
import { StateMessage } from "./components/StateMessage";
import type { RoleRecord } from "./role.type";
import type { SchemaRecord } from "./schema.type";
import type { UserRecord } from "./user.type";

type SchemaEntrySummary = {
  schema: SchemaRecord;
  entries: number;
};

type DashboardState = {
  schemaSummaries: SchemaEntrySummary[];
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
      const schemas = schemaResult.schemas ?? [];
      const entryResults = await Promise.all(schemas.map(async (schema) => ({
        schema,
        result: await listEntries(schema.id),
      })));
      if (!active) return;
      setState({
        schemaSummaries: entryResults.map(({ schema, result }) => ({
          schema,
          entries: result.entries?.length ?? 0,
        })),
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
        <StateMessage title="Dashboard state">{status}</StateMessage>
        {state ? <DashboardSummary state={state} /> : null}
      </section>
    </>
  );
}

function DashboardSummary({ state }: { state: DashboardState }) {
  const schemaCount = state.schemaSummaries.length;
  const entryCount = state.schemaSummaries.reduce((total, item) => total + item.entries, 0);
  const relationCount = countRelationFields(state.schemaSummaries.map((item) => item.schema));
  const schemasWithEntries = state.schemaSummaries.filter((item) => item.entries > 0).length;

  return (
    <>
      <div className="dashboard-metrics" aria-label="Workspace metrics">
        <Metric label="Schemas" value={schemaCount} detail={`${schemaCount} generated APIs`} />
        <Metric label="Entries" value={entryCount} detail={`${schemasWithEntries} schemas contain content`} />
        <Metric label="Roles" value={state.roles.length} detail="Permission profiles" />
        <Metric label="Users" value={state.users.length} detail="Assigned admin users" />
      </div>
      <div className="dashboard-grid">
        <ReadinessSummary
          hasRole={state.roles.length > 0}
          hasSchema={schemaCount > 0}
          hasUser={state.users.length > 0}
          relationCount={relationCount}
        />
        <RecentSchemas summaries={state.schemaSummaries} />
      </div>
      <QuickActions hasRoles={state.roles.length > 0} hasSchemas={schemaCount > 0} />
    </>
  );
}

function Metric({ detail, label, value }: { detail: string; label: string; value: number }) {
  return (
    <article className="dashboard-metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

function ReadinessSummary({
  hasRole,
  hasSchema,
  hasUser,
  relationCount,
}: {
  hasRole: boolean;
  hasSchema: boolean;
  hasUser: boolean;
  relationCount: number;
}) {
  const items = [
    { label: "Schema model", ready: hasSchema, detail: hasSchema ? "Content structure exists" : "Create a schema first" },
    { label: "Relation fields", ready: relationCount > 0, detail: relationCount ? `${relationCount} relation fields configured` : "Optional, add when content links are needed" },
    { label: "Roles", ready: hasRole, detail: hasRole ? "Access rules can be assigned" : "Create role before user access" },
    { label: "Users", ready: hasUser, detail: hasUser ? "Team login is available" : "Add users after roles" },
  ];
  return (
    <section className="dashboard-panel" aria-labelledby="readiness-title">
      <h3 id="readiness-title">Relation and access readiness</h3>
      {items.map((item) => (
        <p className={item.ready ? "readiness-row is-ready" : "readiness-row"} key={item.label}>
          <strong>{item.label}</strong>
          <span>{item.detail}</span>
        </p>
      ))}
    </section>
  );
}

function QuickActions({ hasRoles, hasSchemas }: { hasRoles: boolean; hasSchemas: boolean }) {
  const actions = [
    { href: "#schemas", icon: Database, label: "Create schema", meta: "Define fields and relations" },
    { href: "#entries", icon: FileText, label: "Create entry", meta: hasSchemas ? "Add content to a schema" : "Needs a schema first" },
    { href: "#apis", icon: Network, label: "View APIs", meta: "Inspect generated endpoints" },
    { href: "#roles", icon: KeyRound, label: "Create role", meta: "Prepare allow/block rules" },
    { href: "#users", icon: Users, label: "Create user", meta: hasRoles ? "Assign role-based access" : "Needs a role first" },
    { href: "#docs", icon: BookOpen, label: "Read docs", meta: "Review owner workflow" },
  ];
  return (
    <section className="dashboard-panel quick-actions" aria-labelledby="quick-actions-title">
      <h3 id="quick-actions-title">Quick actions</h3>
      <div className="quick-action-list">
        {actions.map(({ href, icon: Icon, label, meta }) => (
          <a href={href} key={href}>
            <Icon aria-hidden="true" size={18} />
            <span>
              <strong>{label}</strong>
              <small>{meta}</small>
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}

function RecentSchemas({ summaries }: { summaries: SchemaEntrySummary[] }) {
  const recentSchemas = summaries.slice(-4).reverse();
  if (recentSchemas.length === 0) {
    return <p className="empty-state">No schemas yet. Create a schema to generate the first API.</p>;
  }
  return (
    <section className="dashboard-panel" aria-labelledby="recent-schemas-title">
      <h3 id="recent-schemas-title">Recent schemas</h3>
      {recentSchemas.map(({ entries, schema }) => (
        <article className="schema-row" key={schema.id}>
          <strong>{schema.name}</strong>
          <code>/api/content/{schema.slug}</code>
          <span>{schema.fields.length} fields</span>
          <span>{entries} entries</span>
        </article>
      ))}
    </section>
  );
}

function countRelationFields(schemas: SchemaRecord[]) {
  return schemas.reduce((total, schema) => total + schema.fields.filter((field) => field.type === "relation").length, 0);
}
