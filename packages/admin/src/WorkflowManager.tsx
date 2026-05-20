import { useEffect, useMemo, useState } from "react";
import { Copy, Edit3, Plus, RefreshCw, Save, Search, X } from "lucide-react";
import { createWorkflow, listWorkflows, updateWorkflow } from "./api";
import { StateMessage } from "./components/StateMessage";
import { StatusToast } from "./components/StatusToast";
import type { WorkflowDraft, WorkflowRecord } from "./workflow.type";

type WorkflowStatusFilter = "active" | "all" | "inactive";
type WorkflowFormDraft = {
  active: boolean;
  description: string;
  method: string;
  name: string;
  path: string;
};

export function WorkflowManager() {
  const [workflows, setWorkflows] = useState<WorkflowRecord[]>([]);
  const [editingWorkflowId, setEditingWorkflowId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<WorkflowFormDraft>(emptyWorkflowForm());
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

  function openCreateForm() {
    setEditingWorkflowId(null);
    setForm(emptyWorkflowForm());
    setFormOpen(true);
  }

  function openEditForm(workflow: WorkflowRecord) {
    setEditingWorkflowId(workflow.id);
    setForm({
      active: workflow.active,
      description: workflow.description,
      method: workflow.method,
      name: workflow.name,
      path: workflow.path,
    });
    setFormOpen(true);
  }

  async function saveWorkflowBasics() {
    const workflow = workflows.find((item) => item.id === editingWorkflowId);
    const draft = workflowDraftFromForm(form, workflow);
    const result = editingWorkflowId
      ? await updateWorkflow(editingWorkflowId, draft)
      : await createWorkflow(draft);
    if (!result.ok || !result.workflow) {
      setStatus(result.error ?? "Workflow save failed");
      return;
    }
    const savedWorkflow = result.workflow;
    setWorkflows((current) => sortWorkflows(editingWorkflowId
      ? current.map((item) => item.id === savedWorkflow.id ? savedWorkflow : item)
      : [...current, savedWorkflow]));
    setStatus(editingWorkflowId ? `Updated ${savedWorkflow.name}` : `Created ${savedWorkflow.name}`);
    setFormOpen(false);
    setEditingWorkflowId(null);
    setForm(emptyWorkflowForm());
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
        <div className="entry-table-actions">
          <button type="button" onClick={openCreateForm}>
            <Plus aria-hidden="true" size={16} />
            Create workflow
          </button>
          <button type="button" onClick={() => void loadWorkflows()}>
            <RefreshCw aria-hidden="true" size={16} />
            Refresh
          </button>
        </div>
      </div>
      {formOpen ? (
        <WorkflowBasicsForm
          draft={form}
          mode={editingWorkflowId ? "edit" : "create"}
          onCancel={() => {
            setFormOpen(false);
            setEditingWorkflowId(null);
          }}
          onChange={setForm}
          onSave={() => void saveWorkflowBasics()}
        />
      ) : null}
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
                      <button type="button" onClick={() => openEditForm(workflow)}>
                        <Edit3 aria-hidden="true" size={16} />
                        Edit
                      </button>
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

function WorkflowBasicsForm({
  draft,
  mode,
  onCancel,
  onChange,
  onSave,
}: {
  draft: WorkflowFormDraft;
  mode: "create" | "edit";
  onCancel: () => void;
  onChange: (draft: WorkflowFormDraft) => void;
  onSave: () => void;
}) {
  return (
    <section aria-labelledby="workflow-form-title" className="settings-panel workflow-basics-form">
      <div className="entry-table-meta">
        <h3 id="workflow-form-title">{mode === "edit" ? "Edit workflow" : "Create workflow"}</h3>
        <button className="button-secondary" type="button" onClick={onCancel}>
          <X aria-hidden="true" size={16} />
          Close
        </button>
      </div>
      <div className="workflow-form-grid">
        <label>Name
          <input
            value={draft.name}
            onChange={(event) => onChange({ ...draft, name: event.target.value })}
            placeholder="Pay order"
          />
        </label>
        <label>Method
          <select value={draft.method} onChange={(event) => onChange({ ...draft, method: event.target.value })}>
            {["GET", "POST", "PUT", "PATCH", "DELETE"].map((method) => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
        </label>
        <label>Path
          <input
            value={draft.path}
            onChange={(event) => onChange({ ...draft, path: event.target.value })}
            placeholder="/orders/pay"
          />
        </label>
        <label>Description
          <textarea
            value={draft.description}
            onChange={(event) => onChange({ ...draft, description: event.target.value })}
            placeholder="Payment workflow"
          />
        </label>
        <label className="checkbox-row">
          <input
            checked={draft.active}
            type="checkbox"
            onChange={(event) => onChange({ ...draft, active: event.target.checked })}
          />
          Active
        </label>
      </div>
      <p className="helper-text">Mounted route: <code>{mountedWorkflowPath(draft.path)}</code></p>
      <button type="button" onClick={onSave}>
        <Save aria-hidden="true" size={16} />
        Save workflow
      </button>
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

function emptyWorkflowForm(): WorkflowFormDraft {
  return {
    active: false,
    description: "",
    method: "POST",
    name: "",
    path: "",
  };
}

function workflowDraftFromForm(form: WorkflowFormDraft, existing?: WorkflowRecord): WorkflowDraft {
  const path = normalizeWorkflowPath(form.path);
  const method = form.method.toUpperCase();
  return {
    active: form.active,
    definition: definitionForBasics(method, path, existing?.definition),
    description: form.description,
    method,
    name: form.name,
    path,
    version: existing?.version ?? 1,
  };
}

function definitionForBasics(method: string, path: string, existing?: Record<string, unknown>): Record<string, unknown> {
  if (existing && Object.keys(existing).length > 0) {
    return {
      ...existing,
      route: { method, path },
    };
  }
  return {
    edges: [{ from: "start", id: "edge-start-return", to: "return-ok" }],
    nodes: [
      { config: {}, id: "start", type: "routeTrigger" },
      {
        config: {
          body: { ok: true },
          status: 200,
        },
        id: "return-ok",
        type: "returnResponse",
      },
    ],
    route: { method, path },
    startNodeId: "start",
    version: 1,
  };
}

function normalizeWorkflowPath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) return "";
  if (trimmed === "/api/custom") return "/";
  if (trimmed.startsWith("/api/custom/")) return trimmed.slice("/api/custom".length);
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}
