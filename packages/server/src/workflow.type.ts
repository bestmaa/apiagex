export type WorkflowHttpMethod = "DELETE" | "GET" | "PATCH" | "POST" | "PUT";

export type WorkflowDefinitionVersion = 1;

export type WorkflowJsonPrimitive = boolean | null | number | string;

export type WorkflowJsonValue =
  | WorkflowJsonPrimitive
  | WorkflowJsonValue[]
  | { [key: string]: WorkflowJsonValue };

export type WorkflowNodeId = string;

export type WorkflowEdgeId = string;

export type WorkflowNodeType =
  | "branch"
  | "createEntry"
  | "deleteEntry"
  | "getEntry"
  | "queryEntries"
  | "routeTrigger"
  | "returnResponse"
  | "setVariable"
  | "updateEntry"
  | "validateBody";

export type WorkflowNodeFailureBehavior = "continue" | "stop";

export type WorkflowFieldFilterOperator =
  | "contains"
  | "endsWith"
  | "eq"
  | "exists"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "neq"
  | "startsWith";

export type WorkflowBranchOperator =
  | "contains"
  | "empty"
  | "eq"
  | "exists"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "neq"
  | "notEmpty";

export type WorkflowValidationFieldType = "array" | "boolean" | "email" | "number" | "object" | "string";

export type WorkflowBodyValidationFieldRule = {
  enum?: WorkflowJsonPrimitive[];
  maxLength?: number;
  minLength?: number;
  required?: boolean;
  type: WorkflowValidationFieldType;
};

export type WorkflowValidateBodyConfig = {
  fields: Record<string, WorkflowBodyValidationFieldRule>;
  onFailure?: WorkflowNodeFailureBehavior;
};

export type WorkflowRouteTriggerConfig = Record<string, never>;

export type WorkflowEntryFilter = {
  field: string;
  operator: WorkflowFieldFilterOperator;
  value?: WorkflowJsonValue;
};

export type WorkflowQueryEntriesConfig = {
  filters?: WorkflowEntryFilter[];
  limit?: number;
  offset?: number;
  schema: string;
  search?: WorkflowJsonValue;
};

export type WorkflowGetEntryConfig = {
  entryId: WorkflowJsonValue;
};

export type WorkflowEntryDataMapping = Record<string, WorkflowJsonValue>;

export type WorkflowCreateEntryConfig = {
  data: WorkflowEntryDataMapping;
  schema: string;
};

export type WorkflowUpdateEntryConfig = {
  data: WorkflowEntryDataMapping;
  entryId: WorkflowJsonValue;
};

export type WorkflowDeleteEntryConfig = {
  entryId: WorkflowJsonValue;
};

export type WorkflowBranchCondition = {
  left: WorkflowJsonValue;
  operator: WorkflowBranchOperator;
  right?: WorkflowJsonValue;
};

export type WorkflowBranchConfig = {
  condition: WorkflowBranchCondition;
  elseNodeId: WorkflowNodeId;
  thenNodeId: WorkflowNodeId;
};

export type WorkflowSetVariableConfig = {
  values: Record<string, WorkflowJsonValue>;
};

export type WorkflowReturnResponseConfig = {
  body: WorkflowJsonValue;
  headers?: Record<string, string>;
  status: number;
};

export type WorkflowNodeConfigByType = {
  branch: WorkflowBranchConfig;
  createEntry: WorkflowCreateEntryConfig;
  deleteEntry: WorkflowDeleteEntryConfig;
  getEntry: WorkflowGetEntryConfig;
  queryEntries: WorkflowQueryEntriesConfig;
  routeTrigger: WorkflowRouteTriggerConfig;
  returnResponse: WorkflowReturnResponseConfig;
  setVariable: WorkflowSetVariableConfig;
  updateEntry: WorkflowUpdateEntryConfig;
  validateBody: WorkflowValidateBodyConfig;
};

export type WorkflowNodeOutputByType = {
  branch: { matched: boolean };
  createEntry: { entry: WorkflowJsonValue };
  deleteEntry: { deleted: boolean; entryId: string };
  getEntry: { entry: WorkflowJsonValue | null };
  queryEntries: { entries: WorkflowJsonValue[]; limit: number; offset: number; total: number };
  routeTrigger: {
    body: WorkflowJsonValue;
    headers: Record<string, string>;
    params: Record<string, string>;
    query: Record<string, WorkflowJsonValue>;
  };
  returnResponse: { body: WorkflowJsonValue; status: number };
  setVariable: { values: Record<string, WorkflowJsonValue> };
  updateEntry: { entry: WorkflowJsonValue };
  validateBody: { valid: boolean };
};

export type WorkflowRouteDefinition = {
  method: WorkflowHttpMethod;
  path: string;
};

export type WorkflowNodePosition = {
  x: number;
  y: number;
};

export type WorkflowNodeDefinition<TType extends WorkflowNodeType = WorkflowNodeType> = {
  config: WorkflowNodeConfigByType[TType];
  id: WorkflowNodeId;
  label?: string;
  position?: WorkflowNodePosition;
  type: TType;
};

export type AnyWorkflowNodeDefinition = {
  [TType in WorkflowNodeType]: WorkflowNodeDefinition<TType>;
}[WorkflowNodeType];

export type WorkflowEdgeDefinition = {
  from: WorkflowNodeId;
  id: WorkflowEdgeId;
  label?: string;
  to: WorkflowNodeId;
};

export type WorkflowDefinition = {
  edges: WorkflowEdgeDefinition[];
  nodes: AnyWorkflowNodeDefinition[];
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
