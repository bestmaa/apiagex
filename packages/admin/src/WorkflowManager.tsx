import { useEffect, useMemo, useState } from "react";
import { Copy, RefreshCw, Search } from "lucide-react";
import { listWorkflows } from "./api";
import { StateMessage } from "./components/StateMessage";
import { StatusToast } from "./components/StatusToast";
import type { WorkflowRecord } from "./workflow.type";

type WorkflowStatusFilter = "active" | "all" | "inactive";

export function WorkflowManager() {
  const [workflows, setWorkflows] = useState<WorkflowRecord[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Workflow list loading");
  const [statusFilter, setStatusFilter] = useState<WorkflowStatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    void loadWorkflows();
  }, []);

  async function loadWorkflows() {
    setLoading(true);
    setStatus("Workflow list loading");
    const result = await listWorkflows();
    setLoading(false);
    if (!result.ok) {
      setWorkflows([]);
      const message = result.error ?? "Workflow list failed";
      setLoadError(message);
      setStatus(message);
      return;
    }
    setLoadError("");
    const nextWorkflows = result.workflows ?? [];
    setWorkflows(sortWorkflows(nextWorkflows));
    setStatus(nextWorkflows.length ? "Workflow list ready" : "No workflows yet");
  }

  async function copyRoute(workflow: WorkflowRecord) {
    const route = mountedWorkflowPath(workflow.path);
    try {
      await navigator.clipboard.writeText(route);
      setStatus(`Copied ${route}`);
    } catch {
      setStatus(route);
    }
  }

  const filteredWorkflows = useMemo(
    () => filterWorkflows(workflows, search, statusFilter),
    [search, statusFilter, workflows],
  );

  return (
    <section aria-labelledby="workflow-list-title" className="entry-table-panel">
      <div className="entry-table-meta">
        <div>
          <h3 id="workflow-list-title">Workflow list</h3>
          <span>{filteredWorkflows.length} of {workflows.length} workflows</span>
        </div>
        <button type="button" onClick={() => void loadWorkflows()}>
          <RefreshCw aria-hidden="true" size={16} />
          Refresh
        </button>
      </div>
      <div className="entry-table-toolbar">
        <label className="entry-search-field">Find workflow
          <span>
            <Search aria-hidden="true" size={16} />
            <input
              placeholder="Search name, method, path, or version"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </span>
        </label>
        <label>Status
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as WorkflowStatusFilter)}>
            <option value="all">All workflows</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
      </div>
      {loading ? <StateMessage title="Loading workflows" variant="loading">Fetching saved workflows.</StateMessage> : null}
      {!loading && loadError ? (
        <StateMessage title="Workflow list failed" variant="error">{loadError}</StateMessage>
      ) : null}
      {!loading && !loadError && workflows.length === 0 ? (
        <StateMessage title="No workflows yet" variant="empty">Create a workflow to show it here.</StateMessage>
      ) : null}
      {!loading && !loadError && workflows.length > 0 && filteredWorkflows.length === 0 ? (
        <StateMessage title="No matching workflows" variant="empty">Change the search or status filter.</StateMessage>
      ) : null}
      {!loading && !loadError && filteredWorkflows.length > 0 ? (
        <div className="entry-table-scroll">
          <table className="entry-table">
            <thead>
              <tr>
                <th scope="col">Workflow</th>
                <th scope="col">Method</th>
                <th scope="col">Route</th>
                <th scope="col">Status</th>
                <th scope="col">Updated</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorkflows.map((workflow) => (
                <tr key={workflow.id}>
                  <th scope="row">
                    <strong>{workflow.name}</strong>
                    <span>v{workflow.version}</span>
                  </th>
                  <td><code>{workflow.method}</code></td>
                  <td><code>{mountedWorkflowPath(workflow.path)}</code></td>
                  <td><span className={workflow.active ? "status-pill is-active" : "status-pill"}>{workflow.active ? "Active" : "Inactive"}</span></td>
                  <td>{formatDate(workflow.updatedAt)}</td>
                  <td>
                    <div className="entry-table-actions">
                      <button type="button" onClick={() => void copyRoute(workflow)}>
                        <Copy aria-hidden="true" size={16} />
                        Copy route
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <StatusToast title="Workflow status">{status}</StatusToast>
    </section>
  );
}

function mountedWorkflowPath(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (cleanPath === "/api/custom" || cleanPath.startsWith("/api/custom/")) return cleanPath;
  return `/api/custom${cleanPath}`;
}

function filterWorkflows(
  workflows: WorkflowRecord[],
  search: string,
  statusFilter: WorkflowStatusFilter,
): WorkflowRecord[] {
  const normalized = search.trim().toLowerCase();
  return workflows.filter((workflow) => {
    const statusMatch = statusFilter === "all"
      || (statusFilter === "active" && workflow.active)
      || (statusFilter === "inactive" && !workflow.active);
    if (!statusMatch) return false;
    if (!normalized) return true;
    return [
      workflow.method,
      workflow.name,
      workflow.path,
      mountedWorkflowPath(workflow.path),
      `v${workflow.version}`,
    ].some((value) => value.toLowerCase().includes(normalized));
  });
}

function sortWorkflows(workflows: WorkflowRecord[]): WorkflowRecord[] {
  return [...workflows].sort((left, right) => {
    if (left.active !== right.active) return left.active ? -1 : 1;
    return right.updatedAt.localeCompare(left.updatedAt) || left.name.localeCompare(right.name);
  });
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
