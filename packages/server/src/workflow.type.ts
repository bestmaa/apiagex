export type WorkflowHttpMethod = "DELETE" | "GET" | "PATCH" | "POST" | "PUT";

export type WorkflowDefinitionVersion = 1;

export type WorkflowJsonPrimitive = boolean | null | number | string;

export type WorkflowJsonValue =
  | WorkflowJsonPrimitive
  | WorkflowJsonValue[]
  | { [key: string]: WorkflowJsonValue };

export type WorkflowNodeId = string;

export type WorkflowEdgeId = string;

export type WorkflowRouteDefinition = {
  method: WorkflowHttpMethod;
  path: string;
};

export type WorkflowNodePosition = {
  x: number;
  y: number;
};

export type WorkflowNodeDefinition = {
  config: Record<string, WorkflowJsonValue>;
  id: WorkflowNodeId;
  label?: string;
  position?: WorkflowNodePosition;
  type: string;
};

export type WorkflowEdgeDefinition = {
  from: WorkflowNodeId;
  id: WorkflowEdgeId;
  label?: string;
  to: WorkflowNodeId;
};

export type WorkflowDefinition = {
  edges: WorkflowEdgeDefinition[];
  nodes: WorkflowNodeDefinition[];
  route: WorkflowRouteDefinition;
  startNodeId: WorkflowNodeId;
  version: WorkflowDefinitionVersion;
};

export type WorkflowRecord = {
  active: boolean;
  createdAt: string;
  description: string;
  definition: WorkflowDefinition;
  id: string;
  method: WorkflowHttpMethod;
  name: string;
  path: string;
  updatedAt: string;
  version: WorkflowDefinitionVersion;
};

export type WorkflowDraft = {
  active: boolean;
  description?: string;
  definition: WorkflowDefinition;
  method: WorkflowHttpMethod;
  name: string;
  path: string;
};
