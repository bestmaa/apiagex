import { addEdge, Background, Controls, Handle, MiniMap, Position, ReactFlow, useEdgesState, useNodesState } from "@xyflow/react";
import type { Connection, Edge, Node, NodeProps } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useEffect, useMemo, useState } from "react";
import { Copy, Edit3, Plus, RefreshCw, Save, Search, Trash2, UserPlus, X } from "lucide-react";
import { createWorkflow, listSchemas, listWorkflowRuns, listWorkflows, testWorkflow, updateWorkflow } from "./api";
import { StateMessage } from "./components/StateMessage";
import { StatusToast } from "./components/StatusToast";
import type { SchemaFieldDraft, SchemaRecord } from "./schema.type";
import type { WorkflowDraft, WorkflowRecord, WorkflowRunRecord, WorkflowTestRunResult } from "./workflow.type";

type WorkflowStatusFilter = "active" | "all" | "inactive";
type WorkflowViewMode = "graph" | "list";
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
type WorkflowGraphNodeData = {
  config: Record<string, unknown>;
  configSummary: string;
  label: string;
  state: "error" | "ok" | "warning";
  stateText: string;
  workflowType: string;
};
type WorkflowGraphNode = Node<WorkflowGraphNodeData, "workflow">;
type WorkflowGraphEdge = Edge;

const workflowStepTypes: WorkflowStepType[] = [
  "validateBody",
  "queryEntries",
  "createEntry",
  "updateEntry",
  "returnResponse",
];
const workflowGraphNodeTypes = {
  workflow: WorkflowGraphNodeCard,
};

export function WorkflowManager() {
  const [workflows, setWorkflows] = useState<WorkflowRecord[]>([]);
  const [editingWorkflowId, setEditingWorkflowId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<WorkflowFormDraft>(emptyWorkflowForm());
  const [schemas, setSchemas] = useState<SchemaRecord[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Workflow list loading");
  const [statusFilter, setStatusFilter] = useState<WorkflowStatusFilter>("all");
  const [viewMode, setViewMode] = useState<WorkflowViewMode>("list");
  const [graphWorkflowId, setGraphWorkflowId] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    void loadWorkflows();
    void loadSchemaMetadata();
  }, []);

  useEffect(() => {
    if (workflows.length === 0) {
      if (graphWorkflowId) setGraphWorkflowId("");
      return;
    }
    if (!graphWorkflowId || !workflows.some((workflow) => workflow.id === graphWorkflowId)) {
      setGraphWorkflowId(workflows[0]?.id ?? "");
    }
  }, [graphWorkflowId, workflows]);

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

  async function createRegisterTemplate() {
    const draft = registerUserWorkflowTemplate();
    const result = await createWorkflow(draft);
    if (!result.ok || !result.workflow) {
      setStatus(result.error ?? "Register template create failed");
      return;
    }
    setWorkflows((current) => sortWorkflows([...current, result.workflow as WorkflowRecord]));
    setFormOpen(false);
    setEditingWorkflowId(null);
    setForm(emptyWorkflowForm());
    setStatus("Created register user template. Review schema fields and password hashing before activation.");
  }

  async function createOrderStatusTemplate() {
    const draft = orderStatusWorkflowTemplate();
    const result = await createWorkflow(draft);
    if (!result.ok || !result.workflow) {
      setStatus(result.error ?? "Order status template create failed");
      return;
    }
    setWorkflows((current) => sortWorkflows([...current, result.workflow as WorkflowRecord]));
    setFormOpen(false);
    setEditingWorkflowId(null);
    setForm(emptyWorkflowForm());
    setStatus("Created order status template. Review transition rules before activation.");
  }

  async function createReportTemplate() {
    const draft = reportWorkflowTemplate();
    const result = await createWorkflow(draft);
    if (!result.ok || !result.workflow) {
      setStatus(result.error ?? "Report template create failed");
      return;
    }
    setWorkflows((current) => sortWorkflows([...current, result.workflow as WorkflowRecord]));
    setFormOpen(false);
    setEditingWorkflowId(null);
    setForm(emptyWorkflowForm());
    setStatus("Created report template. Keep limits small before activation.");
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
          <button type="button" onClick={() => void createRegisterTemplate()}>
            <UserPlus aria-hidden="true" size={16} />
            Create register template
          </button>
          <button type="button" onClick={() => void createOrderStatusTemplate()}>
            <Plus aria-hidden="true" size={16} />
            Create order status template
          </button>
          <button type="button" onClick={() => void createReportTemplate()}>
            <Plus aria-hidden="true" size={16} />
            Create report template
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
        <div aria-label="Workflow view mode" className="workflow-view-tabs" role="tablist">
          <button
            aria-selected={viewMode === "list"}
            className={viewMode === "list" ? "is-selected" : ""}
            role="tab"
            type="button"
            onClick={() => setViewMode("list")}
          >
            List
          </button>
          <button
            aria-selected={viewMode === "graph"}
            className={viewMode === "graph" ? "is-selected" : ""}
            role="tab"
            type="button"
            onClick={() => setViewMode("graph")}
          >
            Graph
          </button>
        </div>
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
      {!loading && !loadError && workflows.length > 0 && viewMode === "graph" ? (
        <WorkflowGraphShell
          onSelectWorkflow={setGraphWorkflowId}
          onStatus={setStatus}
          onWorkflowSaved={(savedWorkflow) => {
            setWorkflows((current) => sortWorkflows(current.map((workflow) => (
              workflow.id === savedWorkflow.id ? savedWorkflow : workflow
            ))));
            setGraphWorkflowId(savedWorkflow.id);
          }}
          selectedWorkflowId={graphWorkflowId}
          workflows={workflows}
        />
      ) : null}
      {!loading && !loadError && filteredWorkflows.length > 0 && viewMode === "list" ? (
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
                  <td>
                    <div className="workflow-activation-cell">
                      <span className={workflow.active ? "status-pill is-active" : "status-pill"}>{workflow.active ? "Active" : "Inactive"}</span>
                      <small>{workflow.active ? "Needs Custom API permission" : "Not callable"}</small>
                    </div>
                  </td>
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

function WorkflowGraphShell({
  onSelectWorkflow,
  onStatus,
  onWorkflowSaved,
  selectedWorkflowId,
  workflows,
}: {
  onSelectWorkflow: (workflowId: string) => void;
  onStatus: (status: string) => void;
  onWorkflowSaved: (workflow: WorkflowRecord) => void;
  selectedWorkflowId: string;
  workflows: WorkflowRecord[];
}) {
  const selectedWorkflow = workflows.find((workflow) => workflow.id === selectedWorkflowId) ?? workflows[0] ?? null;
  const initialGraph = useMemo(
    () => selectedWorkflow ? workflowGraphFromDefinition(selectedWorkflow) : { edges: [], nodes: [] },
    [selectedWorkflow],
  );
  const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowGraphNode>(initialGraph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<WorkflowGraphEdge>(initialGraph.edges);
  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [selectedEdgeId, setSelectedEdgeId] = useState("");
  const [configJson, setConfigJson] = useState("{}");
  const [graphStatus, setGraphStatus] = useState("Graph editor ready");

  useEffect(() => {
    setNodes(initialGraph.nodes);
    setEdges(initialGraph.edges);
    const firstNode = initialGraph.nodes[0] ?? null;
    setSelectedNodeId(firstNode?.id ?? "");
    setSelectedEdgeId("");
    setConfigJson(jsonText(firstNode?.data.config ?? {}));
    setGraphStatus("Graph loaded");
  }, [initialGraph.edges, initialGraph.nodes, setEdges, setNodes]);

  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null;
  const graphErrors = useMemo(() => validateWorkflowGraph(nodes, edges), [edges, nodes]);

  if (!selectedWorkflow) {
    return <StateMessage title="No workflow graph" variant="empty">Create a workflow to preview the graph.</StateMessage>;
  }

  function onConnect(connection: Connection) {
    if (!connection.source || !connection.target) return;
    setEdges((currentEdges) => addEdge({
      ...connection,
      id: `edge-${connection.source}-${connection.sourceHandle ?? "next"}-${connection.target}`,
    }, currentEdges));
    setGraphStatus("Edge added. Save graph to persist.");
  }

  function selectNode(nodeId: string) {
    const node = nodes.find((item) => item.id === nodeId);
    setSelectedNodeId(nodeId);
    setSelectedEdgeId("");
    setConfigJson(jsonText(node?.data.config ?? {}));
  }

  function addGraphNode(type: string) {
    const id = uniqueNodeId(nodes, type);
    const config = defaultGraphNodeConfig(type);
    const validation = graphNodeValidation(type, config);
    const nextNode: WorkflowGraphNode = {
      data: {
        config,
        configSummary: graphConfigSummary(config),
        label: id,
        state: validation.state,
        stateText: validation.text,
        workflowType: type,
      },
      id,
      position: {
        x: 80 + (nodes.length * 210),
        y: nodes.length % 2 === 0 ? 120 : 260,
      },
      type: "workflow",
    };
    setNodes((currentNodes) => [...currentNodes, nextNode]);
    setSelectedNodeId(id);
    setSelectedEdgeId("");
    setConfigJson(jsonText(config));
    setGraphStatus(`Added ${nodeLabel(type)}. Connect it before saving.`);
  }

  function applySelectedConfig(): boolean {
    if (!selectedNode) {
      setGraphStatus("Select a node before editing config.");
      return false;
    }
    let config: Record<string, unknown>;
    try {
      config = parseJsonObject(configJson, "Node config must be a JSON object.");
    } catch (error) {
      setGraphStatus(error instanceof Error ? error.message : "Node config invalid");
      return false;
    }
    const validation = graphNodeValidation(selectedNode.data.workflowType, config);
    setNodes((currentNodes) => currentNodes.map((node) => {
      if (node.id !== selectedNode.id) return node;
      return graphNodeWithConfig(node, config, validation);
    }));
    setGraphStatus(`Updated ${selectedNode.id} config.`);
    return true;
  }

  function deleteSelectedGraphItem() {
    if (selectedEdgeId) {
      setEdges((currentEdges) => currentEdges.filter((edge) => edge.id !== selectedEdgeId));
      setSelectedEdgeId("");
      setGraphStatus("Edge removed. Save graph to persist.");
      return;
    }
    if (!selectedNode) {
      setGraphStatus("Select a node or edge to delete.");
      return;
    }
    if (selectedNode.data.workflowType === "routeTrigger") {
      setGraphStatus("Route trigger cannot be deleted.");
      return;
    }
    setNodes((currentNodes) => currentNodes.filter((node) => node.id !== selectedNode.id));
    setEdges((currentEdges) => currentEdges.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id));
    setSelectedNodeId("");
    setConfigJson("{}");
    setGraphStatus(`Removed ${selectedNode.id}. Save graph to persist.`);
  }

  async function saveGraph() {
    let nextNodes = nodes;
    if (selectedNode) {
      let config: Record<string, unknown>;
      try {
        config = parseJsonObject(configJson, "Node config must be a JSON object.");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Node config invalid";
        setGraphStatus(message);
        onStatus(message);
        return;
      }
      nextNodes = nodes.map((node) => node.id === selectedNode.id
        ? graphNodeWithConfig(node, config)
        : node);
      setNodes(nextNodes);
    }
    const nextErrors = validateWorkflowGraph(nextNodes, edges);
    if (nextErrors.length > 0) {
      setGraphStatus(`Graph save blocked: ${nextErrors[0]}`);
      onStatus(`Graph save blocked: ${nextErrors[0]}`);
      return;
    }
    const definition = workflowDefinitionFromGraph(selectedWorkflow, nextNodes, edges);
    const result = await updateWorkflow(selectedWorkflow.id, {
      active: selectedWorkflow.active,
      definition,
      description: selectedWorkflow.description,
      method: selectedWorkflow.method,
      name: selectedWorkflow.name,
      path: selectedWorkflow.path,
      version: selectedWorkflow.version,
    });
    if (!result.ok || !result.workflow) {
      const message = result.error ?? "Graph save failed";
      setGraphStatus(message);
      onStatus(message);
      return;
    }
    onWorkflowSaved(result.workflow);
    setGraphStatus("Graph saved");
    onStatus(`Saved graph for ${result.workflow.name}`);
  }

  return (
    <section aria-labelledby="workflow-graph-title" className="workflow-graph-shell">
      <div className="entry-table-meta">
        <div>
          <h3 id="workflow-graph-title">Graph editor</h3>
          <span>Select nodes, edit config, connect edges, then save.</span>
        </div>
        <label>Workflow
          <select value={selectedWorkflow.id} onChange={(event) => onSelectWorkflow(event.target.value)}>
            {workflows.map((workflow) => (
              <option key={workflow.id} value={workflow.id}>
                {workflow.name} - {workflow.method} {mountedWorkflowPath(workflow.path)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="workflow-graph-toolbar">
        <label>Add node
          <select
            value=""
            onChange={(event) => {
              if (event.target.value) addGraphNode(event.target.value);
              event.target.value = "";
            }}
          >
            <option value="">Select node</option>
            <option value="validateBody">Validate body</option>
            <option value="queryEntries">Query entries</option>
            <option value="getEntry">Get entry</option>
            <option value="createEntry">Create entry</option>
            <option value="updateEntry">Update entry</option>
            <option value="deleteEntry">Delete entry</option>
            <option value="branch">Branch</option>
            <option value="setVariable">Set variable</option>
            <option value="returnResponse">Return response</option>
          </select>
        </label>
        <button type="button" onClick={deleteSelectedGraphItem}>
          <Trash2 aria-hidden="true" size={16} />
          Delete selected
        </button>
        <button type="button" onClick={() => void saveGraph()}>
          <Save aria-hidden="true" size={16} />
          Save graph
        </button>
      </div>
      <div className="workflow-graph-route">
        <strong>{selectedWorkflow.name}</strong>
        <code>{selectedWorkflow.method} {mountedWorkflowPath(selectedWorkflow.path)}</code>
        <span>{selectedWorkflow.active ? "Active route" : "Inactive draft"}</span>
      </div>
      <div className="workflow-graph-layout">
        <div className="workflow-graph-canvas" aria-label={`${selectedWorkflow.name} workflow graph`}>
          <ReactFlow
            colorMode="light"
            edges={edges}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.2}
            nodes={nodes}
            nodeTypes={workflowGraphNodeTypes}
            proOptions={{ hideAttribution: true }}
            onConnect={onConnect}
            onEdgesChange={onEdgesChange}
            onEdgeClick={(_event, edge) => {
              setSelectedEdgeId(edge.id);
              setSelectedNodeId("");
              setGraphStatus(`Selected edge ${edge.id}`);
            }}
            onNodeClick={(_event, node) => selectNode(node.id)}
            onNodesChange={onNodesChange}
            onPaneClick={() => {
              setSelectedEdgeId("");
              setSelectedNodeId("");
            }}
          >
            <Background gap={18} />
            <MiniMap pannable zoomable />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
        <aside className="workflow-graph-inspector" aria-label="Graph inspector">
          <h4>Inspector</h4>
          {selectedNode ? (
            <>
              <strong>{selectedNode.id}</strong>
              <span>{nodeLabel(selectedNode.data.workflowType)}</span>
              <label>Config JSON
                <textarea value={configJson} onChange={(event) => setConfigJson(event.target.value)} />
              </label>
              <button type="button" onClick={applySelectedConfig}>Apply config</button>
            </>
          ) : selectedEdgeId ? (
            <p>Selected edge: <code>{selectedEdgeId}</code></p>
          ) : (
            <p>Select a node to edit its config.</p>
          )}
          {graphErrors.length ? (
            <div className="workflow-graph-errors">
              <strong>Graph errors</strong>
              <ul>
                {graphErrors.map((error) => <li key={error}>{error}</li>)}
              </ul>
            </div>
          ) : <p className="workflow-graph-ok">Graph is valid.</p>}
          <StatusToast title="Graph status">{graphStatus}</StatusToast>
        </aside>
      </div>
    </section>
  );
}

function WorkflowGraphNodeCard({ data, selected }: NodeProps<WorkflowGraphNode>) {
  const handles = graphHandlesForType(data.workflowType);
  return (
    <article className={selected ? "workflow-graph-node is-selected" : "workflow-graph-node"}>
      {handles.target ? <Handle id="in" isConnectable={false} position={Position.Left} type="target" /> : null}
      <div className="workflow-graph-node-header">
        <strong>{data.label}</strong>
        <span>{nodeLabel(data.workflowType)}</span>
      </div>
      <p>{data.configSummary}</p>
      <small className={`workflow-graph-node-state is-${data.state}`}>{data.stateText}</small>
      {handles.sources.map((handle) => (
        <Handle
          id={handle.id}
          isConnectable={false}
          key={handle.id}
          position={Position.Right}
          style={{ top: handle.top }}
          type="source"
        />
      ))}
    </article>
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
      <ActivationGuide active={draft.active} />
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
      {mode === "edit" && workflowId ? (
        <>
          <WorkflowTestPanel workflowId={workflowId} />
          <WorkflowRunHistoryPanel workflowId={workflowId} />
        </>
      ) : null}
    </section>
  );
}

function ActivationGuide({ active }: { active: boolean }) {
  return (
    <div className={active ? "workflow-activation-guide is-active" : "workflow-activation-guide"}>
      <strong>{active ? "Route will be callable after permission allow" : "Route is kept private while inactive"}</strong>
      <p>
        {active
          ? "Active publishes the /api/custom route, but clients still need public or token permission in Custom API Permissions."
          : "Inactive workflows stay saved for editing and testing, but the /api/custom route returns 404."}
      </p>
    </div>
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

function WorkflowRunHistoryPanel({ workflowId }: { workflowId: string }) {
  const [runs, setRuns] = useState<WorkflowRunRecord[]>([]);
  const [status, setStatus] = useState("Workflow history loading");

  useEffect(() => {
    void loadRuns();
  }, [workflowId]);

  async function loadRuns() {
    setStatus("Workflow history loading");
    const response = await listWorkflowRuns(workflowId, 20);
    if (!response.ok) {
      setRuns([]);
      setStatus(response.error ?? "Workflow history failed");
      return;
    }
    const nextRuns = response.runs ?? [];
    setRuns(nextRuns);
    setStatus(nextRuns.length ? "Workflow history ready" : "No workflow runs yet");
  }

  return (
    <section aria-labelledby="workflow-history-title" className="workflow-history-panel">
      <div className="entry-table-meta">
        <div>
          <h3 id="workflow-history-title">Run history</h3>
          <span>{runs.length} recent runs</span>
        </div>
        <button type="button" onClick={() => void loadRuns()}>
          <RefreshCw aria-hidden="true" size={16} />
          Refresh history
        </button>
      </div>
      {runs.length ? (
        <div className="workflow-history-list">
          {runs.map((run) => (
            <article className="workflow-history-row" key={run.id}>
              <div>
                <strong className={run.status === "success" ? "status-pill is-active" : "status-pill"}>{run.status}</strong>
                <span>{run.statusCode ?? "no status"} · {run.durationMs} ms</span>
              </div>
              <div>
                <code>{run.request.method} {run.request.path}</code>
                <span>{formatDate(run.createdAt)}</span>
              </div>
              <div>
                <strong>Error</strong>
                <span>{run.errorCode ?? "none"}</span>
              </div>
              <details>
                <summary>Request metadata</summary>
                <pre>{jsonText(run.request)}</pre>
              </details>
            </article>
          ))}
        </div>
      ) : (
        <StateMessage title="No workflow runs yet" variant="empty">Call the workflow API to create run history.</StateMessage>
      )}
      <StatusToast title="Workflow history status">{status}</StatusToast>
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

function workflowGraphFromDefinition(workflow: WorkflowRecord): { edges: WorkflowGraphEdge[]; nodes: WorkflowGraphNode[] } {
  const rawNodes = Array.isArray(workflow.definition.nodes) ? workflow.definition.nodes : [];
  const nodes = rawNodes
    .filter(isRecord)
    .map((node, index) => graphNodeFromWorkflowNode(node, index));
  const fallbackNodes = nodes.length ? nodes : [graphNodeFromWorkflowNode({
    config: {},
    id: "start",
    type: "routeTrigger",
  }, 0)];
  const rawEdges = Array.isArray(workflow.definition.edges) ? workflow.definition.edges : [];
  const edges = rawEdges
    .filter(isRecord)
    .map((edge, index) => graphEdgeFromWorkflowEdge(edge, index))
    .filter((edge): edge is WorkflowGraphEdge => Boolean(edge));
  return {
    edges,
    nodes: fallbackNodes,
  };
}

function graphNodeFromWorkflowNode(node: Record<string, unknown>, index: number): WorkflowGraphNode {
  const id = typeof node.id === "string" && node.id.trim() ? node.id : `node-${index + 1}`;
  const workflowType = typeof node.type === "string" && node.type.trim() ? node.type : "unknown";
  const position = graphNodePosition(node, index);
  const config = isRecord(node.config) ? node.config : {};
  const validation = graphNodeValidation(workflowType, config);
  return {
    data: {
      config,
      configSummary: graphConfigSummary(config),
      label: id,
      state: validation.state,
      stateText: validation.text,
      workflowType,
    },
    draggable: false,
    id,
    position,
    type: "workflow",
  };
}

function graphNodeWithConfig(
  node: WorkflowGraphNode,
  config: Record<string, unknown>,
  validation = graphNodeValidation(node.data.workflowType, config),
): WorkflowGraphNode {
  return {
    ...node,
    data: {
      ...node.data,
      config,
      configSummary: graphConfigSummary(config),
      state: validation.state,
      stateText: validation.text,
    },
  };
}

function workflowDefinitionFromGraph(
  workflow: WorkflowRecord,
  nodes: WorkflowGraphNode[],
  edges: WorkflowGraphEdge[],
): Record<string, unknown> {
  const startNode = nodes.find((node) => node.data.workflowType === "routeTrigger") ?? nodes[0];
  return {
    edges: edges.map((edge) => ({
      id: edge.id,
      ...(edge.sourceHandle ? { sourceHandle: edge.sourceHandle } : {}),
      ...(edge.targetHandle ? { targetHandle: edge.targetHandle } : {}),
      from: edge.source,
      to: edge.target,
    })),
    nodes: nodes.map((node) => ({
      config: node.data.config,
      id: node.id,
      position: node.position,
      type: node.data.workflowType,
    })),
    route: { method: workflow.method, path: workflow.path },
    startNodeId: startNode?.id ?? "start",
    version: 1,
  };
}

function validateWorkflowGraph(nodes: WorkflowGraphNode[], edges: WorkflowGraphEdge[]): string[] {
  const errors: string[] = [];
  const nodeIds = new Set<string>();
  for (const node of nodes) {
    if (nodeIds.has(node.id)) errors.push(`Duplicate node id ${node.id}.`);
    nodeIds.add(node.id);
    if (node.data.state === "error") errors.push(`${node.id}: ${node.data.stateText}.`);
  }
  const triggerNodes = nodes.filter((node) => node.data.workflowType === "routeTrigger");
  if (triggerNodes.length !== 1) errors.push("Graph needs exactly one route trigger.");
  if (!nodes.some((node) => node.data.workflowType === "returnResponse")) errors.push("Graph needs at least one return response.");
  for (const edge of edges) {
    if (!nodeIds.has(edge.source)) errors.push(`Edge ${edge.id} source node is missing.`);
    if (!nodeIds.has(edge.target)) errors.push(`Edge ${edge.id} target node is missing.`);
  }
  const edgeIds = new Set<string>();
  for (const edge of edges) {
    if (edgeIds.has(edge.id)) errors.push(`Duplicate edge id ${edge.id}.`);
    edgeIds.add(edge.id);
  }
  for (const node of nodes) {
    if (node.data.workflowType === "routeTrigger") continue;
    if (!edges.some((edge) => edge.target === node.id)) errors.push(`${node.id} needs an incoming edge.`);
  }
  for (const node of nodes) {
    if (node.data.workflowType !== "returnResponse") continue;
    if (edges.some((edge) => edge.source === node.id)) errors.push(`${node.id} cannot have outgoing edges.`);
  }
  return errors;
}

function uniqueNodeId(nodes: WorkflowGraphNode[], type: string): string {
  const base = type.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`).replace(/^-/, "");
  const existingIds = new Set(nodes.map((node) => node.id));
  for (let index = 1; index < 1000; index += 1) {
    const id = `${base}-${index}`;
    if (!existingIds.has(id)) return id;
  }
  return `${base}-${Date.now()}`;
}

function defaultGraphNodeConfig(type: string): Record<string, unknown> {
  if (type === "validateBody") return { fields: { field: { required: true, type: "string" } } };
  if (type === "queryEntries") return { limit: 10, schema: "" };
  if (type === "getEntry") return { entryId: "{{body.id}}" };
  if (type === "createEntry") return { data: {}, schema: "" };
  if (type === "updateEntry") return { data: {}, entryId: "{{body.id}}" };
  if (type === "deleteEntry") return { entryId: "{{body.id}}" };
  if (type === "branch") return { left: "{{body.value}}", operator: "exists" };
  if (type === "setVariable") return { values: {} };
  if (type === "returnResponse") return { body: { ok: true }, status: 200 };
  return {};
}

function graphNodePosition(node: Record<string, unknown>, index: number): { x: number; y: number } {
  if (isRecord(node.position)
    && typeof node.position.x === "number"
    && typeof node.position.y === "number"
    && Number.isFinite(node.position.x)
    && Number.isFinite(node.position.y)) {
    return {
      x: node.position.x,
      y: node.position.y,
    };
  }
  return {
    x: 48 + (index * 230),
    y: index % 2 === 0 ? 92 : 210,
  };
}

function graphEdgeFromWorkflowEdge(edge: Record<string, unknown>, index: number): WorkflowGraphEdge | null {
  const source = typeof edge.from === "string" ? edge.from : typeof edge.source === "string" ? edge.source : "";
  const target = typeof edge.to === "string" ? edge.to : typeof edge.target === "string" ? edge.target : "";
  if (!source || !target) return null;
  return {
    animated: false,
    id: typeof edge.id === "string" && edge.id.trim() ? edge.id : `edge-${source}-${target}-${index}`,
    label: typeof edge.sourceHandle === "string" ? edge.sourceHandle : undefined,
    source,
    sourceHandle: typeof edge.sourceHandle === "string" ? edge.sourceHandle : undefined,
    target,
    targetHandle: typeof edge.targetHandle === "string" ? edge.targetHandle : undefined,
  };
}

function graphConfigSummary(config: unknown): string {
  if (!isRecord(config)) return "No config";
  if (typeof config.schema === "string") return `schema: ${config.schema}`;
  if (typeof config.status === "number") return `status: ${config.status}`;
  if (isRecord(config.fields)) return `${Object.keys(config.fields).length} field rule(s)`;
  if (Object.keys(config).length === 0) return "No config";
  return `${Object.keys(config).length} config value(s)`;
}

function graphNodeValidation(type: string, config: unknown): { state: WorkflowGraphNodeData["state"]; text: string } {
  const knownTypes = new Set([
    "branch",
    "createEntry",
    "deleteEntry",
    "getEntry",
    "queryEntries",
    "returnResponse",
    "routeTrigger",
    "setVariable",
    "updateEntry",
    "validateBody",
  ]);
  if (!knownTypes.has(type)) return { state: "error", text: "Unsupported node" };
  if (!isRecord(config)) return { state: "warning", text: "Config not readable" };
  if (["createEntry", "queryEntries"].includes(type)
    && (typeof config.schema !== "string" || !config.schema.trim())) {
    return { state: "error", text: "Schema missing" };
  }
  if (type === "returnResponse" && typeof config.status !== "number") {
    return { state: "warning", text: "Status default needed" };
  }
  return { state: "ok", text: "Ready" };
}

function graphHandlesForType(type: string): { sources: Array<{ id: string; top?: number }>; target: boolean } {
  if (type === "routeTrigger") return { sources: [{ id: "next" }], target: false };
  if (type === "returnResponse") return { sources: [], target: true };
  if (type === "branch") return {
    sources: [
      { id: "then", top: 42 },
      { id: "else", top: 86 },
    ],
    target: true,
  };
  return { sources: [{ id: "next" }], target: true };
}

function nodeLabel(type: string): string {
  if (type === "routeTrigger") return "Route trigger";
  if (type === "validateBody") return "Validate body";
  if (type === "queryEntries") return "Query entries";
  if (type === "getEntry") return "Get entry";
  if (type === "createEntry") return "Create entry";
  if (type === "updateEntry") return "Update entry";
  if (type === "deleteEntry") return "Delete entry";
  if (type === "branch") return "Branch";
  if (type === "setVariable") return "Set variable";
  if (type === "returnResponse") return "Return response";
  return type;
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

function registerUserWorkflowTemplate(): WorkflowDraft {
  const path = "/auth/register";
  const method = "POST";
  return {
    active: false,
    definition: registerUserWorkflowDefinition(method, path),
    description: "Starter public registration API. Requires a users schema with email, passwordHash, and status fields. Replace the placeholder password hashing before production.",
    method,
    name: "Register user template",
    path,
    version: 1,
  };
}

function registerUserWorkflowDefinition(method: string, path: string): Record<string, unknown> {
  return {
    edges: [
      { from: "start", id: "edge-start-validate-email", to: "validate-email" },
      { from: "validate-email", id: "edge-validate-email-validate-password", to: "validate-password" },
      { from: "validate-password", id: "edge-validate-password-check-existing-user", to: "check-existing-user" },
      { from: "check-existing-user", id: "edge-check-existing-user-duplicate-branch", to: "duplicate-branch" },
      { from: "duplicate-branch", id: "edge-duplicate-branch-return-user-exists", to: "return-user-exists" },
      { from: "duplicate-branch", id: "edge-duplicate-branch-create-inactive-user", to: "create-inactive-user" },
      { from: "create-inactive-user", id: "edge-create-inactive-user-return-created", to: "return-created" },
    ],
    nodes: [
      { config: {}, id: "start", type: "routeTrigger" },
      {
        config: {
          fields: {
            email: { required: true, type: "email" },
          },
        },
        id: "validate-email",
        type: "validateBody",
      },
      {
        config: {
          fields: {
            password: { minLength: 8, required: true, type: "string" },
          },
        },
        id: "validate-password",
        type: "validateBody",
      },
      {
        config: {
          filters: [{ field: "email", operator: "eq", value: "{{body.email}}" }],
          limit: 1,
          schema: "users",
        },
        id: "check-existing-user",
        type: "queryEntries",
      },
      {
        config: {
          condition: {
            left: "{{steps.check-existing-user.total}}",
            operator: "gt",
            right: 0,
          },
          elseNodeId: "create-inactive-user",
          thenNodeId: "return-user-exists",
        },
        id: "duplicate-branch",
        type: "branch",
      },
      {
        config: {
          data: {
            email: "{{body.email}}",
            passwordHash: "PASSWORD_HASH_PLACEHOLDER_REPLACE_WITH_SERVER_SIDE_HASHING",
            status: "inactive",
          },
          schema: "users",
        },
        id: "create-inactive-user",
        type: "createEntry",
      },
      {
        config: {
          body: {
            message: "Registration saved. Replace passwordHash placeholder before production.",
            ok: true,
            status: "inactive",
            userId: "{{steps.create-inactive-user.entry.id}}",
          },
          status: 201,
        },
        id: "return-created",
        type: "returnResponse",
      },
      {
        config: {
          body: {
            error: "USER_ALREADY_EXISTS",
            ok: false,
          },
          status: 409,
        },
        id: "return-user-exists",
        type: "returnResponse",
      },
    ],
    route: { method, path },
    startNodeId: "start",
    version: 1,
  };
}

function orderStatusWorkflowTemplate(): WorkflowDraft {
  const path = "/orders/status";
  const method = "POST";
  return {
    active: false,
    definition: orderStatusWorkflowDefinition(method, path),
    description: "Starter order status API. Requires orderId to be an entry id and allows pending->preparing, pending->cancelled, preparing->ready, preparing->cancelled, and ready->completed.",
    method,
    name: "Order status template",
    path,
    version: 1,
  };
}

function orderStatusWorkflowDefinition(method: string, path: string): Record<string, unknown> {
  return {
    edges: [
      { from: "start", id: "edge-start-validate-order-id", to: "validate-order-id" },
      { from: "validate-order-id", id: "edge-validate-order-id-validate-status", to: "validate-status" },
      { from: "validate-status", id: "edge-validate-status-get-order", to: "get-order" },
      { from: "get-order", id: "edge-get-order-check-current-pending", to: "check-current-pending" },
      { from: "check-current-pending", id: "edge-check-current-pending-check-pending-preparing", to: "check-pending-preparing" },
      { from: "check-current-pending", id: "edge-check-current-pending-check-current-preparing", to: "check-current-preparing" },
      { from: "check-pending-preparing", id: "edge-check-pending-preparing-update-order", to: "update-order" },
      { from: "check-pending-preparing", id: "edge-check-pending-preparing-check-pending-cancelled", to: "check-pending-cancelled" },
      { from: "check-pending-cancelled", id: "edge-check-pending-cancelled-update-order", to: "update-order" },
      { from: "check-pending-cancelled", id: "edge-check-pending-cancelled-return-invalid", to: "return-invalid-transition" },
      { from: "check-current-preparing", id: "edge-check-current-preparing-check-preparing-ready", to: "check-preparing-ready" },
      { from: "check-current-preparing", id: "edge-check-current-preparing-check-current-ready", to: "check-current-ready" },
      { from: "check-preparing-ready", id: "edge-check-preparing-ready-update-order", to: "update-order" },
      { from: "check-preparing-ready", id: "edge-check-preparing-ready-check-preparing-cancelled", to: "check-preparing-cancelled" },
      { from: "check-preparing-cancelled", id: "edge-check-preparing-cancelled-update-order", to: "update-order" },
      { from: "check-preparing-cancelled", id: "edge-check-preparing-cancelled-return-invalid", to: "return-invalid-transition" },
      { from: "check-current-ready", id: "edge-check-current-ready-check-ready-completed", to: "check-ready-completed" },
      { from: "check-current-ready", id: "edge-check-current-ready-return-invalid", to: "return-invalid-transition" },
      { from: "check-ready-completed", id: "edge-check-ready-completed-update-order", to: "update-order" },
      { from: "check-ready-completed", id: "edge-check-ready-completed-return-invalid", to: "return-invalid-transition" },
      { from: "update-order", id: "edge-update-order-return-updated", to: "return-updated" },
    ],
    nodes: [
      { config: {}, id: "start", type: "routeTrigger" },
      {
        config: {
          fields: {
            orderId: { required: true, type: "string" },
          },
        },
        id: "validate-order-id",
        type: "validateBody",
      },
      {
        config: {
          fields: {
            status: {
              enum: ["preparing", "ready", "completed", "cancelled"],
              required: true,
              type: "string",
            },
          },
        },
        id: "validate-status",
        type: "validateBody",
      },
      {
        config: {
          entryId: "{{body.orderId}}",
        },
        id: "get-order",
        type: "getEntry",
      },
      orderBranch("check-current-pending", "{{steps.get-order.entry.data.status}}", "pending", "check-pending-preparing", "check-current-preparing"),
      orderBranch("check-pending-preparing", "{{body.status}}", "preparing", "update-order", "check-pending-cancelled"),
      orderBranch("check-pending-cancelled", "{{body.status}}", "cancelled", "update-order", "return-invalid-transition"),
      orderBranch("check-current-preparing", "{{steps.get-order.entry.data.status}}", "preparing", "check-preparing-ready", "check-current-ready"),
      orderBranch("check-preparing-ready", "{{body.status}}", "ready", "update-order", "check-preparing-cancelled"),
      orderBranch("check-preparing-cancelled", "{{body.status}}", "cancelled", "update-order", "return-invalid-transition"),
      orderBranch("check-current-ready", "{{steps.get-order.entry.data.status}}", "ready", "check-ready-completed", "return-invalid-transition"),
      orderBranch("check-ready-completed", "{{body.status}}", "completed", "update-order", "return-invalid-transition"),
      {
        config: {
          data: {
            status: "{{body.status}}",
          },
          entryId: "{{body.orderId}}",
        },
        id: "update-order",
        type: "updateEntry",
      },
      {
        config: {
          body: {
            ok: true,
            order: "{{steps.update-order.entry}}",
            status: "{{body.status}}",
          },
          status: 200,
        },
        id: "return-updated",
        type: "returnResponse",
      },
      {
        config: {
          body: {
            currentStatus: "{{steps.get-order.entry.data.status}}",
            error: "ORDER_STATUS_TRANSITION_INVALID",
            ok: false,
            requestedStatus: "{{body.status}}",
          },
          status: 409,
        },
        id: "return-invalid-transition",
        type: "returnResponse",
      },
    ],
    route: { method, path },
    startNodeId: "start",
    version: 1,
  };
}

function orderBranch(
  id: string,
  left: string,
  right: string,
  thenNodeId: string,
  elseNodeId: string,
): Record<string, unknown> {
  return {
    config: {
      condition: {
        left,
        operator: "eq",
        right,
      },
      elseNodeId,
      thenNodeId,
    },
    id,
    type: "branch",
  };
}

function reportWorkflowTemplate(): WorkflowDraft {
  const path = "/reports/orders";
  const method = "GET";
  return {
    active: false,
    definition: reportWorkflowDefinition(method, path),
    description: "Read-only report API starter. Queries the orders schema with limit 50 and returns total plus the first page of entries.",
    method,
    name: "Orders report template",
    path,
    version: 1,
  };
}

function reportWorkflowDefinition(method: string, path: string): Record<string, unknown> {
  return {
    edges: [
      { from: "start", id: "edge-start-query-orders", to: "query-orders" },
      { from: "query-orders", id: "edge-query-orders-return-report", to: "return-report" },
    ],
    nodes: [
      { config: {}, id: "start", type: "routeTrigger" },
      {
        config: {
          limit: 50,
          offset: 0,
          schema: "orders",
        },
        id: "query-orders",
        type: "queryEntries",
      },
      {
        config: {
          body: {
            entries: "{{steps.query-orders.entries}}",
            limit: "{{steps.query-orders.limit}}",
            ok: true,
            offset: "{{steps.query-orders.offset}}",
            total: "{{steps.query-orders.total}}",
          },
          status: 200,
        },
        id: "return-report",
        type: "returnResponse",
      },
    ],
    route: { method, path },
    startNodeId: "start",
    version: 1,
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
