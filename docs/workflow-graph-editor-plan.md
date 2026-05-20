# Workflow Graph Editor Plan

This document defines the planned graph editor for Workflow APIs. The graph editor is only a visual editor for the existing workflow JSON contract. It must not introduce behavior that the workflow executor cannot validate and run.

## Decision

Use React Flow for the Admin UI graph editor.

Reasons:

- It already supports draggable nodes, edge creation, handles, controls, minimap, keyboard interaction, and viewport management.
- It stores node positions separately from business configuration, which matches the current `node.position` workflow JSON field.
- It can render custom node components while keeping edges as normal graph data.
- It keeps the graph editor inside React, matching the current Admin UI stack.

## Core Principle

The runtime workflow JSON is the source of truth.

React Flow state is an editing projection:

```txt
Workflow JSON -> React Flow nodes/edges -> user edits -> validate -> Workflow JSON
```

Saving must fail if the React Flow graph cannot be converted into a valid executable workflow. The UI must not save partial visual-only graph behavior.

## Data Model

Workflow JSON remains:

```ts
type WorkflowDefinition = {
  version: 1;
  route: {
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    path: string;
  };
  startNodeId: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
};
```

React Flow nodes should use the workflow node id as the React Flow id:

```ts
type WorkflowGraphNodeData = {
  workflowType: WorkflowNode["type"];
  label: string;
  config: WorkflowNode["config"];
  validation: {
    level: "ok" | "warning" | "error";
    messages: string[];
  };
};
```

React Flow edge ids should remain stable:

```txt
edge-{sourceNodeId}-{targetNodeId}
edge-{sourceNodeId}-{handleName}-{targetNodeId}
```

Branch edges need named source handles:

```txt
then
else
```

## Node UI

Each node card should show:

- node label
- node type
- key config summary
- validation state
- incoming/outgoing connection handles

Node configuration lives in a side panel, not inside large inline forms on the canvas. The canvas should stay readable at small and large workflow sizes.

## Handles

Use predictable handles per node type.

| Node type | Input handles | Output handles |
| --- | --- | --- |
| `routeTrigger` | none | `next` |
| `validateBody` | `in` | `next`, optional `invalid` later |
| `queryEntries` | `in` | `next` |
| `getEntry` | `in` | `next` |
| `createEntry` | `in` | `next` |
| `updateEntry` | `in` | `next` |
| `deleteEntry` | `in` | `next` |
| `branch` | `in` | `then`, `else` |
| `setVariable` | `in` | `next` |
| `returnResponse` | `in` | none |

The first implementation should keep `validateBody` as a normal single-output step because the current runtime stops on invalid input. Add an `invalid` handle only after the executor supports that path.

## Edge Rules

The graph editor must enforce these rules before save:

- exactly one `routeTrigger` node
- `startNodeId` points to the `routeTrigger`
- every non-trigger executable node is reachable from the trigger
- every non-trigger node has at least one incoming edge
- `returnResponse` nodes have no outgoing edges
- non-final action nodes have exactly one normal outgoing edge
- `branch` nodes can have at most one `then` edge and one `else` edge
- edge endpoints must use handles supported by the source and target node type
- cycles are blocked in MVP
- duplicate node ids and duplicate edge ids are blocked

These rules keep the visual graph compatible with the current sequential executor.

## Conversion To Workflow JSON

On load:

1. Read workflow `definition.nodes`.
2. Convert each workflow node to a React Flow node.
3. Copy `node.position` when present.
4. If a node has no position, place it using auto-layout.
5. Convert workflow edges to React Flow edges.

On save:

1. Validate graph shape.
2. Validate each node config with the same schema used by the runtime.
3. Convert React Flow nodes back to workflow nodes.
4. Persist `position` from React Flow only as layout metadata.
5. Convert React Flow edges back to workflow edges.
6. Save the workflow definition only after validation succeeds.

`position` must never affect runtime execution.

## Layout

MVP layout should be deterministic:

- trigger on the left
- normal flow left-to-right
- branch `then` path above
- branch `else` path below
- returns at the right edge

Auto-layout can run when:

- opening a workflow with missing positions
- clicking a toolbar layout action
- creating a template

Manual node movement should update `position` only after save.

## Toolbar

Initial toolbar:

- add node
- auto-layout
- zoom controls
- fit view
- validate
- save
- discard changes

Minimap is useful once workflows exceed a few nodes, but it should be collapsible so the editor stays clean on small screens.

## Validation UI

Validation should appear in three places:

- node badge for node-level errors
- edge style for invalid connections
- side panel list for full graph errors

Saving an active workflow should require zero validation errors. Draft inactive workflows may allow warnings, but not invalid runtime JSON.

## Runtime Safety

The editor must not allow:

- arbitrary JavaScript nodes
- custom code snippets inside node config
- unsupported async/background behavior
- unbounded list queries
- response nodes that leak internal stack traces
- secret values saved as plain workflow JSON

Large query nodes must keep the same runtime caps as form-built workflows.

## Testing Plan

Add tests in stages:

- conversion helpers: workflow JSON to graph and graph to workflow JSON
- validation helpers: edge rules, branch rules, reachability, cycle rejection
- Admin UI render: empty canvas, template load, node selection, config panel
- save behavior: invalid graph blocks save, valid graph saves workflow JSON
- browser smoke: create template, open graph editor, move node, validate, save

## Rollout

Implement in small steps:

1. Add React Flow dependency and empty editor shell.
2. Add JSON-to-graph and graph-to-JSON helpers with tests.
3. Render read-only existing workflow nodes and edges.
4. Add node selection and config side panel.
5. Add validation overlay and save blocking.
6. Add add-node and connect-edge interactions.
7. Add auto-layout.
8. Add browser tests for Custom Workflow graph editing.

