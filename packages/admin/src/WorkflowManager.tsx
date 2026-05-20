import { useEffect, useMemo, useState } from "react";
import { Copy, Edit3, Plus, RefreshCw, Save, Search, X } from "lucide-react";
import { createWorkflow, listSchemas, listWorkflows, testWorkflow, updateWorkflow } from "./api";
import { StateMessage } from "./components/StateMessage";
import { StatusToast } from "./components/StatusToast";
import type { SchemaFieldDraft, SchemaRecord } from "./schema.type";
import type { WorkflowDraft, WorkflowRecord, WorkflowTestRunResult } from "./workflow.type";

type WorkflowStatusFilter = "active" | "all" | "inactive";
type WorkflowStepType = "createEntry" | "queryEntries" | "returnResponse" | "updateEntry" | "validateBody";
type WorkflowFormDraft = {
  active: boolean;
  description: string;
  method: string;
  name: string;
  path: string;
  steps: WorkflowStepDraft[];
};
type WorkflowStepDraft = {
  body: string;
  dataJson: string;
  entryId: string;
  fieldName: string;
  fieldRequired: boolean;
  fieldType: string;
  id: string;
  limit: number;
  schema: string;
  search: string;
  status: number;
  type: WorkflowStepType;
};

const workflowStepTypes: WorkflowStepType[] = [
  "validateBody",
  "queryEntries",
  "createEntry",
  "updateEntry",
  "returnResponse",
];

export function WorkflowManager() {
  const [workflows, setWorkflows] = useState<WorkflowRecord[]>([]);
  const [editingWorkflowId, setEditingWorkflowId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<WorkflowFormDraft>(emptyWorkflowForm());
  const [schemas, setSchemas] = useState<SchemaRecord[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Workflow list loading");
  const [statusFilter, setStatusFilter] = useState<WorkflowStatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    void loadWorkflows();
    void loadSchemaMetadata();
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

  async function loadSchemaMetadata() {
    const result = await listSchemas();
    setSchemas(sortSchemas(result.schemas ?? []));
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
      steps: stepsFromDefinition(workflow.definition),
    });
    setFormOpen(true);
  }

  async function saveWorkflowBasics() {
    const workflow = workflows.find((item) => item.id === editingWorkflowId);
    let draft: WorkflowDraft;
    try {
      draft = workflowDraftFromForm(form, workflow);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Invalid workflow");
      return;
    }
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
          schemas={schemas}
          onSave={() => void saveWorkflowBasics()}
          workflowId={editingWorkflowId}
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
  schemas,
  onSave,
  workflowId,
}: {
  draft: WorkflowFormDraft;
  mode: "create" | "edit";
  onCancel: () => void;
  onChange: (draft: WorkflowFormDraft) => void;
  schemas: SchemaRecord[];
  onSave: () => void;
  workflowId: string | null;
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
      <WorkflowStepEditor
        onChange={(steps) => onChange({ ...draft, steps })}
        schemas={schemas}
        steps={draft.steps}
      />
      <p className="helper-text">Mounted route: <code>{mountedWorkflowPath(draft.path)}</code></p>
      <button type="button" onClick={onSave}>
        <Save aria-hidden="true" size={16} />
        Save workflow
      </button>
      {mode === "edit" && workflowId ? <WorkflowTestPanel workflowId={workflowId} /> : null}
    </section>
  );
}

function WorkflowTestPanel({ workflowId }: { workflowId: string }) {
  const [bodyJson, setBodyJson] = useState(jsonText({ message: "hello" }));
  const [headersJson, setHeadersJson] = useState(jsonText({}));
  const [paramsJson, setParamsJson] = useState(jsonText({}));
  const [queryJson, setQueryJson] = useState(jsonText({}));
  const [result, setResult] = useState<WorkflowTestRunResult | null>(null);
  const [status, setStatus] = useState("Workflow test ready");

  async function runTest() {
    let body: unknown;
    let headers: Record<string, unknown>;
    let params: Record<string, unknown>;
    let query: Record<string, unknown>;
    try {
      body = parseJsonValue(bodyJson, "Invalid test request: body must be valid JSON.");
      headers = parseJsonObject(headersJson, "Invalid test request: headers must be a JSON object.");
      params = parseJsonObject(paramsJson, "Invalid test request: params must be a JSON object.");
      query = parseJsonObject(queryJson, "Invalid test request: query must be a JSON object.");
    } catch (error) {
      setResult(null);
      setStatus(error instanceof Error ? error.message : "Invalid test request");
      return;
    }
    setStatus("Running workflow test");
    const response = await testWorkflow(workflowId, { body, headers, params, query });
    if (!response.ok || !response.result) {
      setResult(null);
      setStatus(response.error ?? "Workflow test failed");
      return;
    }
    setResult(response.result);
    setStatus(response.result.ok ? "Workflow test passed" : "Workflow test returned an error");
  }

  return (
    <section aria-labelledby="workflow-test-title" className="workflow-test-panel">
      <div className="entry-table-meta">
        <div>
          <h3 id="workflow-test-title">Test run</h3>
          <span>Admin-only preview request</span>
        </div>
        <button type="button" onClick={() => void runTest()}>Run test</button>
      </div>
      <div className="workflow-test-grid">
        <label>Body JSON
          <textarea value={bodyJson} onChange={(event) => setBodyJson(event.target.value)} />
        </label>
        <label>Query JSON
          <textarea value={queryJson} onChange={(event) => setQueryJson(event.target.value)} />
        </label>
        <label>Params JSON
          <textarea value={paramsJson} onChange={(event) => setParamsJson(event.target.value)} />
        </label>
        <label>Headers JSON
          <textarea value={headersJson} onChange={(event) => setHeadersJson(event.target.value)} />
        </label>
      </div>
      {result ? (
        <div className="workflow-test-output">
          <div>
            <h4>Response</h4>
            <pre>{jsonText(result.response)}</pre>
          </div>
          <div>
            <h4>Step outputs</h4>
            <pre>{jsonText(result.steps)}</pre>
          </div>
          <div>
            <h4>Error</h4>
            <pre>{jsonText(result.error)}</pre>
          </div>
        </div>
      ) : null}
      <StatusToast title="Workflow test status">{status}</StatusToast>
    </section>
  );
}

function WorkflowStepEditor({
  onChange,
  schemas,
  steps,
}: {
  onChange: (steps: WorkflowStepDraft[]) => void;
  schemas: SchemaRecord[];
  steps: WorkflowStepDraft[];
}) {
  function addStep(type: WorkflowStepType) {
    const nextStep = defaultStep(type);
    if (type !== "returnResponse" && steps.at(-1)?.type === "returnResponse") {
      onChange([...steps.slice(0, -1), nextStep, steps[steps.length - 1] as WorkflowStepDraft]);
      return;
    }
    onChange([...steps, nextStep]);
  }

  function updateStep(index: number, nextStep: WorkflowStepDraft) {
    onChange(steps.map((step, stepIndex) => stepIndex === index ? nextStep : step));
  }

  function removeStep(index: number) {
    if (steps.length <= 1) return;
    onChange(steps.filter((_, stepIndex) => stepIndex !== index));
  }

  function moveStep(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= steps.length) return;
    const nextSteps = [...steps];
    const [step] = nextSteps.splice(index, 1);
    if (!step) return;
    nextSteps.splice(nextIndex, 0, step);
    onChange(nextSteps);
  }

  return (
    <section aria-labelledby="workflow-step-editor-title" className="workflow-step-editor">
      <div className="entry-table-meta">
        <div>
          <h3 id="workflow-step-editor-title">Steps</h3>
          <span>{steps.length} ordered steps</span>
        </div>
        <label>Add step
          <select
            value=""
            onChange={(event) => {
              if (event.target.value) addStep(event.target.value as WorkflowStepType);
              event.target.value = "";
            }}
          >
            <option value="">Select step</option>
            <option value="validateBody">Validate body</option>
            <option value="queryEntries">Query entries</option>
            <option value="createEntry">Create entry</option>
            <option value="updateEntry">Update entry</option>
            <option value="returnResponse">Return response</option>
          </select>
        </label>
      </div>
      <div className="workflow-step-list">
        {steps.map((step, index) => (
          <fieldset className="workflow-step-card" key={`${step.id}-${index}`}>
            <legend>{index + 1}. {stepLabel(step.type)}</legend>
            <div className="workflow-step-identity">
              <label>Step id
                <input value={step.id} onChange={(event) => updateStep(index, { ...step, id: event.target.value })} />
              </label>
              <label>Type
                <select value={step.type} onChange={(event) => updateStep(index, convertStepType(step, event.target.value as WorkflowStepType))}>
                  {workflowStepTypes.map((type) => (
                    <option key={type} value={type}>{stepLabel(type)}</option>
                  ))}
                </select>
              </label>
            </div>
            <WorkflowStepFields
              schemas={schemas}
              step={step}
              onChange={(nextStep) => updateStep(index, nextStep)}
            />
            <div className="entry-table-actions">
              <button disabled={index === 0} type="button" onClick={() => moveStep(index, -1)}>Move up</button>
              <button disabled={index === steps.length - 1} type="button" onClick={() => moveStep(index, 1)}>Move down</button>
              <button disabled={steps.length <= 1} type="button" onClick={() => removeStep(index)}>Remove</button>
            </div>
          </fieldset>
        ))}
      </div>
    </section>
  );
}

function WorkflowStepFields({
  onChange,
  schemas,
  step,
}: {
  onChange: (step: WorkflowStepDraft) => void;
  schemas: SchemaRecord[];
  step: WorkflowStepDraft;
}) {
  const selectedSchema = schemaForSlug(schemas, step.schema);
  if (step.type === "validateBody") {
    return (
      <div className="workflow-step-fields">
        <label>Field name
          <input value={step.fieldName} placeholder="email" onChange={(event) => onChange({ ...step, fieldName: event.target.value })} />
        </label>
        <label>Field type
          <select value={step.fieldType} onChange={(event) => onChange({ ...step, fieldType: event.target.value })}>
            {["string", "email", "number", "boolean", "array", "object"].map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
        <label className="checkbox-row">
          <input checked={step.fieldRequired} type="checkbox" onChange={(event) => onChange({ ...step, fieldRequired: event.target.checked })} />
          Required
        </label>
      </div>
    );
  }
  if (step.type === "queryEntries") {
    return (
      <div className="workflow-step-fields">
        <SchemaPicker
          schemas={schemas}
          value={step.schema}
          onChange={(schemaSlug) => onChange({ ...step, schema: schemaSlug })}
        />
        <label>Schema slug
          <input value={step.schema} placeholder="orders" onChange={(event) => onChange({ ...step, schema: event.target.value })} />
        </label>
        <FieldTemplatePicker
          fields={selectedSchema?.fields ?? []}
          label="Search from field"
          onPick={(field) => onChange({ ...step, search: `{{body.${field.slug}}}` })}
        />
        <label>Search
          <input value={step.search} placeholder="{{body.email}}" onChange={(event) => onChange({ ...step, search: event.target.value })} />
        </label>
        <label>Limit
          <input min={1} max={100} type="number" value={step.limit} onChange={(event) => onChange({ ...step, limit: Number(event.target.value) })} />
        </label>
      </div>
    );
  }
  if (step.type === "createEntry") {
    return (
      <div className="workflow-step-fields">
        <SchemaPicker
          schemas={schemas}
          value={step.schema}
          onChange={(schemaSlug) => onChange({ ...step, schema: schemaSlug })}
        />
        <label>Schema slug
          <input value={step.schema} placeholder="orders" onChange={(event) => onChange({ ...step, schema: event.target.value })} />
        </label>
        <FieldTemplatePicker
          fields={selectedSchema?.fields ?? []}
          label="Add data field"
          onPick={(field) => onChange({ ...step, dataJson: addFieldMapping(step.dataJson, field.slug) })}
        />
        <label>Data JSON
          <textarea value={step.dataJson} onChange={(event) => onChange({ ...step, dataJson: event.target.value })} />
        </label>
      </div>
    );
  }
  if (step.type === "updateEntry") {
    return (
      <div className="workflow-step-fields">
        <SchemaPicker
          schemas={schemas}
          value={step.schema}
          onChange={(schemaSlug) => onChange({ ...step, schema: schemaSlug })}
        />
        <label>Schema slug
          <input value={step.schema} placeholder="orders" onChange={(event) => onChange({ ...step, schema: event.target.value })} />
        </label>
        <label>Entry id
          <input value={step.entryId} placeholder="{{body.id}}" onChange={(event) => onChange({ ...step, entryId: event.target.value })} />
        </label>
        <FieldTemplatePicker
          fields={selectedSchema?.fields ?? []}
          label="Add data field"
          onPick={(field) => onChange({ ...step, dataJson: addFieldMapping(step.dataJson, field.slug) })}
        />
        <label>Data JSON
          <textarea value={step.dataJson} onChange={(event) => onChange({ ...step, dataJson: event.target.value })} />
        </label>
      </div>
    );
  }
  return (
    <div className="workflow-step-fields">
      <label>Status
        <input min={100} max={599} type="number" value={step.status} onChange={(event) => onChange({ ...step, status: Number(event.target.value) })} />
      </label>
      <label>Body JSON
        <textarea value={step.body} onChange={(event) => onChange({ ...step, body: event.target.value })} />
      </label>
    </div>
  );
}

function SchemaPicker({
  onChange,
  schemas,
  value,
}: {
  onChange: (schemaSlug: string) => void;
  schemas: SchemaRecord[];
  value: string;
}) {
  return (
    <label>Pick schema
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">{schemas.length ? "Select schema" : "No schemas available"}</option>
        {schemas.map((schema) => (
          <option key={schema.id} value={schema.slug}>{schema.name} ({schema.slug})</option>
        ))}
      </select>
    </label>
  );
}

function FieldTemplatePicker({
  fields,
  label,
  onPick,
}: {
  fields: SchemaFieldDraft[];
  label: string;
  onPick: (field: SchemaFieldDraft) => void;
}) {
  return (
    <label>{label}
      <select
        value=""
        onChange={(event) => {
          const field = fields.find((item) => item.slug === event.target.value);
          if (field) onPick(field);
          event.target.value = "";
        }}
      >
        <option value="">{fields.length ? "Select field" : "Select schema first"}</option>
        {fields.map((field) => (
          <option key={field.slug} value={field.slug}>{field.name} ({field.slug})</option>
        ))}
      </select>
    </label>
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

function sortSchemas(schemas: SchemaRecord[]): SchemaRecord[] {
  return [...schemas].sort((left, right) => left.name.localeCompare(right.name));
}

function schemaForSlug(schemas: SchemaRecord[], slug: string): SchemaRecord | undefined {
  return schemas.find((schema) => schema.slug === slug);
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
    steps: [defaultStep("returnResponse")],
  };
}

function workflowDraftFromForm(form: WorkflowFormDraft, existing?: WorkflowRecord): WorkflowDraft {
  validateWorkflowForm(form);
  const path = normalizeWorkflowPath(form.path);
  const method = form.method.toUpperCase();
  return {
    active: form.active,
    definition: definitionFromSteps(method, path, form.steps),
    description: form.description,
    method,
    name: form.name.trim(),
    path,
    version: existing?.version ?? 1,
  };
}

function normalizeWorkflowPath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) return "";
  if (trimmed === "/api/custom") return "/";
  if (trimmed.startsWith("/api/custom/")) return trimmed.slice("/api/custom".length);
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function validateWorkflowForm(form: WorkflowFormDraft): void {
  const method = form.method.toUpperCase();
  if (!form.name.trim()) throw new Error("Invalid workflow: name is required.");
  if (!["DELETE", "GET", "PATCH", "POST", "PUT"].includes(method)) {
    throw new Error("Invalid workflow: HTTP method is not supported.");
  }
  if (!normalizeWorkflowPath(form.path)) throw new Error("Invalid workflow: path is required.");
  if (form.steps.length === 0) throw new Error("Invalid workflow: add at least one step.");
  const ids = new Set<string>();
  form.steps.forEach((step, index) => {
    const stepNumber = index + 1;
    const id = step.id.trim();
    if (!id) throw new Error(`Invalid workflow: step ${stepNumber} id is required.`);
    if (id === "start") throw new Error(`Invalid workflow: step ${stepNumber} cannot use reserved id start.`);
    if (ids.has(id)) throw new Error(`Invalid workflow: duplicate step id ${id}.`);
    ids.add(id);
    validateStepConfig(step, stepNumber);
  });
  if (form.steps.at(-1)?.type !== "returnResponse") {
    throw new Error("Invalid workflow: final step must return a response.");
  }
}

function validateStepConfig(step: WorkflowStepDraft, stepNumber: number): void {
  if (step.type === "validateBody") {
    if (!step.fieldName.trim()) throw new Error(`Invalid workflow: step ${stepNumber} needs a field name.`);
    if (!["array", "boolean", "email", "number", "object", "string"].includes(step.fieldType)) {
      throw new Error(`Invalid workflow: step ${stepNumber} has an unsupported field type.`);
    }
    return;
  }
  if (step.type === "queryEntries") {
    if (!step.schema.trim()) throw new Error(`Invalid workflow: step ${stepNumber} needs a schema slug.`);
    if (!Number.isInteger(step.limit) || step.limit < 1 || step.limit > 100) {
      throw new Error(`Invalid workflow: step ${stepNumber} limit must be between 1 and 100.`);
    }
    return;
  }
  if (step.type === "createEntry") {
    if (!step.schema.trim()) throw new Error(`Invalid workflow: step ${stepNumber} needs a schema slug.`);
    parseJsonObject(step.dataJson, `Invalid workflow: step ${stepNumber} data must be a JSON object.`);
    return;
  }
  if (step.type === "updateEntry") {
    if (!step.entryId.trim()) throw new Error(`Invalid workflow: step ${stepNumber} needs an entry id.`);
    parseJsonObject(step.dataJson, `Invalid workflow: step ${stepNumber} data must be a JSON object.`);
    return;
  }
  if (!Number.isInteger(step.status) || step.status < 100 || step.status > 599) {
    throw new Error(`Invalid workflow: step ${stepNumber} status must be between 100 and 599.`);
  }
  parseJsonValue(step.body, `Invalid workflow: step ${stepNumber} body must be valid JSON.`);
}

function definitionFromSteps(method: string, path: string, steps: WorkflowStepDraft[]): Record<string, unknown> {
  const nodes = [
    { config: {}, id: "start", type: "routeTrigger" },
    ...steps.map((step) => ({
      config: configFromStep(step),
      id: step.id.trim(),
      type: step.type,
    })),
  ];
  const nodeIds = nodes.map((node) => node.id);
  return {
    edges: nodeIds.slice(0, -1).map((from, index) => ({
      from,
      id: `edge-${from}-${nodeIds[index + 1]}`,
      to: nodeIds[index + 1],
    })),
    nodes,
    route: { method, path },
    startNodeId: "start",
    version: 1,
  };
}

function configFromStep(step: WorkflowStepDraft): Record<string, unknown> {
  if (step.type === "validateBody") {
    return {
      fields: {
        [step.fieldName.trim()]: {
          required: step.fieldRequired,
          type: step.fieldType,
        },
      },
    };
  }
  if (step.type === "queryEntries") {
    return {
      ...(step.search.trim() ? { search: step.search.trim() } : {}),
      limit: step.limit,
      schema: step.schema.trim(),
    };
  }
  if (step.type === "createEntry") {
    return {
      data: parseJsonObject(step.dataJson, "Invalid workflow: data must be a JSON object."),
      schema: step.schema.trim(),
    };
  }
  if (step.type === "updateEntry") {
    return {
      data: parseJsonObject(step.dataJson, "Invalid workflow: data must be a JSON object."),
      entryId: expressionFromText(step.entryId),
    };
  }
  return {
    body: parseJsonValue(step.body, "Invalid workflow: response body must be valid JSON."),
    status: step.status,
  };
}

function addFieldMapping(dataJson: string, fieldSlug: string): string {
  const current = safeJsonObject(dataJson);
  return jsonText({
    ...current,
    [fieldSlug]: `{{body.${fieldSlug}}}`,
  });
}

function stepsFromDefinition(definition?: Record<string, unknown>): WorkflowStepDraft[] {
  const nodes = Array.isArray(definition?.nodes) ? definition.nodes : [];
  const steps = nodes
    .map((node) => stepFromNode(node))
    .filter((step): step is WorkflowStepDraft => Boolean(step));
  return steps.length ? steps : [defaultStep("returnResponse")];
}

function stepFromNode(node: unknown): WorkflowStepDraft | null {
  if (!isRecord(node) || typeof node.type !== "string" || !isWorkflowStepType(node.type)) return null;
  const base = defaultStep(node.type);
  const id = typeof node.id === "string" && node.id.trim() ? node.id : base.id;
  const config = isRecord(node.config) ? node.config : {};
  if (node.type === "validateBody") {
    const fields = isRecord(config.fields) ? config.fields : {};
    const [fieldName, rawRule] = Object.entries(fields)[0] ?? ["", undefined];
    const rule = isRecord(rawRule) ? rawRule : {};
    return {
      ...base,
      fieldName,
      fieldRequired: rule.required === true,
      fieldType: typeof rule.type === "string" ? rule.type : base.fieldType,
      id,
    };
  }
  if (node.type === "queryEntries") {
    return {
      ...base,
      id,
      limit: typeof config.limit === "number" ? config.limit : base.limit,
      schema: typeof config.schema === "string" ? config.schema : "",
      search: typeof config.search === "undefined" ? "" : textFromExpression(config.search),
    };
  }
  if (node.type === "createEntry") {
    return {
      ...base,
      dataJson: jsonText(isRecord(config.data) ? config.data : {}),
      id,
      schema: typeof config.schema === "string" ? config.schema : "",
    };
  }
  if (node.type === "updateEntry") {
    return {
      ...base,
      dataJson: jsonText(isRecord(config.data) ? config.data : {}),
      entryId: typeof config.entryId === "undefined" ? "" : textFromExpression(config.entryId),
      id,
    };
  }
  return {
    ...base,
    body: typeof config.body === "undefined" ? base.body : jsonText(config.body),
    id,
    status: typeof config.status === "number" ? config.status : base.status,
  };
}

function defaultStep(type: WorkflowStepType): WorkflowStepDraft {
  const id = `${stepIdPrefix(type)}-${crypto.randomUUID().slice(0, 8)}`;
  return {
    body: jsonText({ ok: true }),
    dataJson: jsonText({}),
    entryId: "{{body.id}}",
    fieldName: "",
    fieldRequired: true,
    fieldType: "string",
    id,
    limit: 20,
    schema: "",
    search: "",
    status: 200,
    type,
  };
}

function convertStepType(step: WorkflowStepDraft, type: WorkflowStepType): WorkflowStepDraft {
  return {
    ...defaultStep(type),
    id: step.id,
  };
}

function stepLabel(type: WorkflowStepType): string {
  if (type === "validateBody") return "Validate body";
  if (type === "queryEntries") return "Query entries";
  if (type === "createEntry") return "Create entry";
  if (type === "updateEntry") return "Update entry";
  return "Return response";
}

function stepIdPrefix(type: WorkflowStepType): string {
  if (type === "validateBody") return "validate";
  if (type === "queryEntries") return "query";
  if (type === "createEntry") return "create";
  if (type === "updateEntry") return "update";
  return "return";
}

function isWorkflowStepType(type: string): type is WorkflowStepType {
  return workflowStepTypes.includes(type as WorkflowStepType);
}

function parseJsonObject(text: string, errorMessage: string): Record<string, unknown> {
  const value = parseJsonValue(text, errorMessage);
  if (!isRecord(value)) throw new Error(errorMessage);
  return value;
}

function safeJsonObject(text: string): Record<string, unknown> {
  try {
    const value = JSON.parse(text) as unknown;
    return isRecord(value) ? value : {};
  } catch {
    return {};
  }
}

function parseJsonValue(text: string, errorMessage: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(errorMessage);
  }
}

function expressionFromText(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) return "";
  if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
    return parseJsonValue(trimmed, "Invalid workflow: expression must be valid JSON.");
  }
  return trimmed;
}

function textFromExpression(value: unknown): string {
  return typeof value === "string" ? value : jsonText(value);
}

function jsonText(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
