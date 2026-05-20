export type WorkflowHttpMethod = "DELETE" | "GET" | "PATCH" | "POST" | "PUT";

export type WorkflowDefinitionVersion = 1;

export type WorkflowJsonPrimitive = boolean | null | number | string;

export type WorkflowJsonValue =
  | WorkflowJsonPrimitive
  | WorkflowJsonValue[]
  | { [key: string]: WorkflowJsonValue };

export type WorkflowExpressionRoot = "body" | "headers" | "params" | "query" | "steps" | "vars";

export type WorkflowExpressionPath = WorkflowExpressionRoot | `${WorkflowExpressionRoot}.${string}`;

export type WorkflowExpressionTemplate = `{{${WorkflowExpressionPath}}}`;

export type WorkflowExpressionPrimitive = WorkflowJsonPrimitive | WorkflowExpressionTemplate;

export type WorkflowExpressionValue =
  | WorkflowExpressionPrimitive
  | WorkflowExpressionValue[]
  | { [key: string]: WorkflowExpressionValue };

export type WorkflowErrorCode =
  | "HTTP_PRIVATE_NETWORK_BLOCKED"
  | "HTTP_REDIRECT_NOT_ALLOWED"
  | "HTTP_REQUEST_FAILED"
  | "HTTP_REQUEST_TIMEOUT"
  | "HTTP_RESPONSE_JSON_INVALID"
  | "HTTP_RESPONSE_TOO_LARGE"
  | "HTTP_SECRET_NOT_FOUND"
  | "HTTP_STATUS_NOT_ALLOWED"
  | "HTTP_TEMPLATE_VALUE_MISSING"
  | "HTTP_URL_NOT_ALLOWED"
  | "WORKFLOW_BAD_ROUTE_CONFIG"
  | "WORKFLOW_DEFINITION_INVALID"
  | "WORKFLOW_ENTRY_NOT_FOUND"
  | "WORKFLOW_FORBIDDEN"
  | "WORKFLOW_LIMIT_EXCEEDED"
  | "WORKFLOW_NODE_FAILED"
  | "WORKFLOW_NOT_FOUND"
  | "WORKFLOW_SCHEMA_NOT_FOUND"
  | "WORKFLOW_VALIDATION_FAILED";

export type WorkflowErrorHttpStatus = 400 | 403 | 404 | 422 | 500;

export type WorkflowErrorStatusByCode = {
  WORKFLOW_BAD_ROUTE_CONFIG: 400;
  WORKFLOW_DEFINITION_INVALID: 422;
  WORKFLOW_ENTRY_NOT_FOUND: 404;
  WORKFLOW_FORBIDDEN: 403;
  WORKFLOW_LIMIT_EXCEEDED: 422;
  WORKFLOW_NODE_FAILED: 500;
  WORKFLOW_NOT_FOUND: 404;
  WORKFLOW_SCHEMA_NOT_FOUND: 404;
  WORKFLOW_VALIDATION_FAILED: 400;
};

export type WorkflowErrorDetails = Record<string, WorkflowJsonValue>;

export type WorkflowErrorResponse = {
  error: {
    code: WorkflowErrorCode;
    details?: WorkflowErrorDetails;
    message: string;
    nodeId?: WorkflowNodeId;
    workflowId?: string;
  };
  ok: false;
};

export type WorkflowNodeId = string;

export type WorkflowEdgeId = string;

export type WorkflowNodeType =
  | "branch"
  | "createEntry"
  | "deleteEntry"
  | "getEntry"
  | "httpRequest"
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
  value?: WorkflowExpressionValue;
};

export type WorkflowQueryEntriesConfig = {
  filters?: WorkflowEntryFilter[];
  limit?: number;
  offset?: number;
  schema: string;
  search?: WorkflowExpressionValue;
};

export type WorkflowGetEntryConfig = {
  entryId: WorkflowExpressionValue;
};

export type WorkflowEntryDataMapping = Record<string, WorkflowExpressionValue>;

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
  left: WorkflowExpressionValue;
  operator: WorkflowBranchOperator;
  right?: WorkflowExpressionValue;
};

export type WorkflowBranchConfig = {
  condition: WorkflowBranchCondition;
  elseNodeId: WorkflowNodeId;
  thenNodeId: WorkflowNodeId;
};

export type WorkflowSetVariableConfig = {
  values: Record<string, WorkflowExpressionValue>;
};

export type WorkflowHttpRequestBodyMode = "json" | "none" | "text";

export type WorkflowHttpRequestRetryConfig = {
  attempts?: number;
  backoffMs?: number;
};

export type WorkflowHttpRequestConfig = {
  body?: WorkflowExpressionValue;
  headers?: Record<string, WorkflowExpressionValue>;
  method: WorkflowHttpMethod;
  outputKey?: string;
  query?: Record<string, WorkflowExpressionValue>;
  responseBodyMode?: WorkflowHttpRequestBodyMode;
  retry?: WorkflowHttpRequestRetryConfig;
  successStatus?: number[];
  timeoutMs?: number;
  url: string;
};

export type WorkflowReturnResponseConfig = {
  body: WorkflowExpressionValue;
  headers?: Record<string, string>;
  status: number;
};

export type WorkflowNodeConfigByType = {
  branch: WorkflowBranchConfig;
  createEntry: WorkflowCreateEntryConfig;
  deleteEntry: WorkflowDeleteEntryConfig;
  getEntry: WorkflowGetEntryConfig;
  httpRequest: WorkflowHttpRequestConfig;
  queryEntries: WorkflowQueryEntriesConfig;
  routeTrigger: WorkflowRouteTriggerConfig;
  returnResponse: WorkflowReturnResponseConfig;
  setVariable: WorkflowSetVariableConfig;
  updateEntry: WorkflowUpdateEntryConfig;
  validateBody: WorkflowValidateBodyConfig;
};

export type WorkflowNodeOutputByType = {
  branch: { matched: boolean; nextNodeId: WorkflowNodeId };
  createEntry: { entry: WorkflowJsonValue };
  deleteEntry: { deleted: boolean; entryId: string };
  getEntry: { entry: WorkflowJsonValue | null };
  httpRequest: {
    attempts: number;
    body: WorkflowJsonValue;
    headers: Record<string, string>;
    status: number;
  };
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
