import { FormEvent, useEffect, useMemo, useState } from "react";
import { Building2, KeyRound, RefreshCw, Search, ShieldCheck } from "lucide-react";

const platformTokenStorageKey = "apiagexPlatformToken";

type PlatformTenant = {
  createdAt: string;
  databaseProvider: "sqlite" | "postgres" | "mysql";
  databaseUrlConfigured: boolean;
  displayName: string;
  id: string;
  plan: string | null;
  primaryDomain: string | null;
  slug: string;
  status: "provisioning" | "active" | "suspended" | "migration_required" | "failed" | "archived";
  subdomain: string | null;
  uploadsPath: string;
};

export function PlatformPage() {
  const [token, setToken] = useState(() => localStorage.getItem(platformTokenStorageKey) ?? "");
  const [tenants, setTenants] = useState<PlatformTenant[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [status, setStatus] = useState(token ? "Platform token saved" : "Platform token missing");

  const filteredTenants = useMemo(() => tenants.filter((tenant) => {
    const matchesSearch = !search.trim()
      || tenant.slug.includes(search.trim().toLowerCase())
      || tenant.displayName.toLowerCase().includes(search.trim().toLowerCase());
    const matchesStatus = statusFilter === "all" || tenant.status === statusFilter;
    const matchesProvider = providerFilter === "all" || tenant.databaseProvider === providerFilter;
    return matchesSearch && matchesStatus && matchesProvider;
  }), [providerFilter, search, statusFilter, tenants]);
  const selectedTenant = useMemo(
    () => tenants.find((tenant) => tenant.id === selectedTenantId) ?? filteredTenants[0] ?? null,
    [filteredTenants, selectedTenantId, tenants],
  );

  useEffect(() => {
    if (token) loadTenants(token, setTenants, setStatus);
  }, [token]);

  function saveToken(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const nextToken = String(data.get("platformToken") ?? "").trim();
    if (!nextToken) {
      localStorage.removeItem(platformTokenStorageKey);
      setToken("");
      setStatus("Platform token missing");
      return;
    }
    localStorage.setItem(platformTokenStorageKey, nextToken);
    setToken(nextToken);
    setStatus("Platform token saved");
    loadTenants(nextToken, setTenants, setStatus);
  }

  function clearToken() {
    localStorage.removeItem(platformTokenStorageKey);
    setToken("");
    setTenants([]);
    setStatus("Platform token cleared");
  }

  async function createTenant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      setStatus("Platform token missing");
      return;
    }
    const data = new FormData(event.currentTarget);
    const payload = {
      databaseProvider: String(data.get("databaseProvider") ?? "sqlite"),
      databaseUrl: String(data.get("databaseUrl") ?? "").trim(),
      displayName: String(data.get("displayName") ?? "").trim(),
      plan: String(data.get("plan") ?? "").trim() || null,
      primaryDomain: String(data.get("primaryDomain") ?? "").trim() || null,
      slug: String(data.get("slug") ?? "").trim(),
      uploadsPath: String(data.get("uploadsPath") ?? "").trim(),
    };
    setStatus("Creating tenant");
    try {
      const response = await fetch("/api/platform/tenants", {
        body: JSON.stringify(payload),
        headers: {
          "content-type": "application/json",
          "x-apiagex-platform-token": token,
        },
        method: "POST",
      });
      const body = await response.json() as { error?: string; ok: boolean };
      if (!response.ok || !body.ok) {
        setStatus(body.error ?? "Tenant create failed");
        return;
      }
      event.currentTarget.reset();
      await loadTenants(token, setTenants, setStatus);
    } catch {
      setStatus("Tenant create failed");
    }
  }

  return (
    <>
      <section className="summary-panel">
        <h2>Platform</h2>
        <p>Manage tenants separately from this tenant Admin UI.</p>
      </section>
      <section className="dashboard-summary-section">
        <h2>Platform Access</h2>
        <div className="dashboard-metrics" aria-label="Platform access status">
          <article className="dashboard-metric dashboard-metric-blue">
            <span className="dashboard-metric-label">Boundary</span>
            <strong>Platform</strong>
            <span className="dashboard-metric-icon">
              <ShieldCheck aria-hidden="true" size={18} />
            </span>
            <p>/api/platform routes</p>
          </article>
          <article className="dashboard-metric dashboard-metric-green">
            <span className="dashboard-metric-label">Tenant Registry</span>
            <strong>{tenants.length}</strong>
            <span className="dashboard-metric-icon">
              <Building2 aria-hidden="true" size={18} />
            </span>
            <p>{filteredTenants.length} visible</p>
          </article>
          <article className="dashboard-metric dashboard-metric-violet">
            <span className="dashboard-metric-label">Token</span>
            <strong>{token ? "Set" : "Missing"}</strong>
            <span className="dashboard-metric-icon">
              <KeyRound aria-hidden="true" size={18} />
            </span>
            <p>{status}</p>
          </article>
        </div>
        <form className="settings-panel" onSubmit={saveToken}>
          <h3>Platform Token</h3>
          <label>
            Token
            <input
              autoComplete="off"
              defaultValue={token}
              name="platformToken"
              placeholder="x-apiagex-platform-token"
              type="password"
            />
          </label>
          <div className="form-actions">
            <button type="submit">Save</button>
            <button onClick={clearToken} type="button">Clear</button>
            <button onClick={() => loadTenants(token, setTenants, setStatus)} type="button">
              <RefreshCw aria-hidden="true" size={16} />
              Refresh
            </button>
          </div>
        </form>
        <section className="settings-panel">
          <h3>Tenants</h3>
          <form className="platform-create-form" onSubmit={createTenant}>
            <div className="settings-grid">
              <label>
                Name
                <input name="displayName" required />
              </label>
              <label>
                Slug
                <input name="slug" pattern="[a-z][a-z0-9-]*" required />
              </label>
              <label>
                Provider
                <select name="databaseProvider" defaultValue="sqlite">
                  <option value="sqlite">SQLite</option>
                  <option value="postgres">PostgreSQL</option>
                  <option value="mysql">MySQL</option>
                </select>
              </label>
              <label>
                Database URL
                <input autoComplete="off" name="databaseUrl" required type="password" />
              </label>
              <label>
                Uploads path
                <input name="uploadsPath" required />
              </label>
              <label>
                Plan
                <input name="plan" />
              </label>
              <label>
                Domain
                <input name="primaryDomain" />
              </label>
            </div>
            <div className="form-actions">
              <button type="submit">Create</button>
            </div>
          </form>
          <div className="settings-grid">
            <label>
              Search
              <span className="input-with-icon">
                <Search aria-hidden="true" size={16} />
                <input value={search} onChange={(event) => setSearch(event.target.value)} />
              </span>
            </label>
            <label>
              Status
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">All</option>
                <option value="provisioning">Provisioning</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="migration_required">Migration required</option>
                <option value="failed">Failed</option>
                <option value="archived">Archived</option>
              </select>
            </label>
            <label>
              Provider
              <select value={providerFilter} onChange={(event) => setProviderFilter(event.target.value)}>
                <option value="all">All</option>
                <option value="sqlite">SQLite</option>
                <option value="postgres">PostgreSQL</option>
                <option value="mysql">MySQL</option>
              </select>
            </label>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Status</th>
                  <th>Provider</th>
                  <th>Domain</th>
                  <th>Plan</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTenants.map((tenant) => (
                  <tr key={tenant.id}>
                    <td>
                      <strong>{tenant.displayName}</strong>
                      <span>{tenant.slug}</span>
                    </td>
                    <td>{tenant.status}</td>
                    <td>{tenant.databaseProvider}</td>
                    <td>{tenant.primaryDomain ?? tenant.subdomain ?? "-"}</td>
                    <td>{tenant.plan ?? "-"}</td>
                    <td>{new Date(tenant.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button onClick={() => setSelectedTenantId(tenant.id)} type="button">Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredTenants.length === 0 ? <p className="empty-state">No tenants found.</p> : null}
          </div>
          {selectedTenant ? (
            <TenantDetail
              onAction={(action) => runTenantAction(token, selectedTenant.id, action, setTenants, setStatus)}
              tenant={selectedTenant}
            />
          ) : null}
        </section>
      </section>
    </>
  );
}

type TenantAction = "activate" | "archive" | "retry" | "suspend";

function TenantDetail({ onAction, tenant }: { onAction: (action: TenantAction) => void; tenant: PlatformTenant }) {
  const adminUrl = tenant.primaryDomain
    ? `https://${tenant.primaryDomain}/adminui`
    : tenant.subdomain
      ? `https://${tenant.subdomain}/adminui`
      : "/adminui";
  return (
    <section className="dashboard-panel platform-tenant-detail">
      <h3>{tenant.displayName}</h3>
      <div className="settings-grid">
        <p>
          <strong>Status</strong>
          <span>{tenant.status}</span>
        </p>
        <p>
          <strong>Provider</strong>
          <span>{tenant.databaseProvider}</span>
        </p>
        <p>
          <strong>Database</strong>
          <span>{tenant.databaseUrlConfigured ? "Configured" : "Missing"}</span>
        </p>
        <p>
          <strong>Uploads</strong>
          <span>{tenant.uploadsPath}</span>
        </p>
        <p>
          <strong>Domain</strong>
          <span>{tenant.primaryDomain ?? tenant.subdomain ?? "-"}</span>
        </p>
        <p>
          <strong>Plan</strong>
          <span>{tenant.plan ?? "-"}</span>
        </p>
      </div>
      <div className="form-actions">
        <button disabled={tenant.status === "suspended"} onClick={() => onAction("suspend")} type="button">
          Suspend
        </button>
        <button disabled={tenant.status === "active"} onClick={() => onAction("activate")} type="button">
          Activate
        </button>
        <button disabled={tenant.status !== "failed"} onClick={() => onAction("retry")} type="button">
          Retry
        </button>
        <button disabled={tenant.status === "archived"} onClick={() => onAction("archive")} type="button">
          Archive
        </button>
        <a href={adminUrl}>Open Admin UI</a>
      </div>
    </section>
  );
}

export function readStoredPlatformToken(): string | null {
  return localStorage.getItem(platformTokenStorageKey);
}

async function loadTenants(
  token: string,
  setTenants: (tenants: PlatformTenant[]) => void,
  setStatus: (status: string) => void,
) {
  if (!token) {
    setStatus("Platform token missing");
    return;
  }
  setStatus("Loading tenants");
  try {
    const response = await fetch("/api/platform/tenants", {
      headers: { "x-apiagex-platform-token": token },
    });
    const body = await response.json() as { error?: string; ok: boolean; tenants?: PlatformTenant[] };
    if (!response.ok || !body.ok) {
      setStatus(body.error ?? "Tenant list failed");
      return;
    }
    setTenants(body.tenants ?? []);
    setStatus("Tenants loaded");
  } catch {
    setStatus("Tenant list failed");
  }
}

async function runTenantAction(
  token: string,
  tenantId: string,
  action: TenantAction,
  setTenants: (tenants: PlatformTenant[]) => void,
  setStatus: (status: string) => void,
) {
  if (!token) {
    setStatus("Platform token missing");
    return;
  }
  if ((action === "archive" || action === "suspend") && !window.confirm(`Confirm ${action} for this tenant?`)) return;
  const statusByAction: Partial<Record<TenantAction, PlatformTenant["status"]>> = {
    activate: "active",
    archive: "archived",
    suspend: "suspended",
  };
  const path = action === "retry"
    ? `/api/platform/tenants/${tenantId}/reprovision`
    : `/api/platform/tenants/${tenantId}/status`;
  const body = action === "retry" ? {} : { status: statusByAction[action] };
  setStatus("Updating tenant");
  try {
    const response = await fetch(path, {
      body: JSON.stringify(body),
      headers: {
        "content-type": "application/json",
        "x-apiagex-platform-token": token,
      },
      method: action === "retry" ? "POST" : "PATCH",
    });
    const result = await response.json() as { error?: string; ok: boolean };
    if (!response.ok || !result.ok) {
      setStatus(result.error ?? "Tenant update failed");
      return;
    }
    await loadTenants(token, setTenants, setStatus);
  } catch {
    setStatus("Tenant update failed");
  }
}
