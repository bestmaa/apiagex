import type { WorkflowDefinitionJson } from "./workflow-repository.type.js";

export type WorkflowValidationIssue = {
  code:
    | "WORKFLOW_BAD_ROUTE_CONFIG"
    | "WORKFLOW_DEFINITION_INVALID"
    | "WORKFLOW_NODE_CONFIG_INVALID"
    | "WORKFLOW_NODE_DISCONNECTED"
    | "WORKFLOW_NODE_DUPLICATE"
    | "WORKFLOW_NODE_TYPE_UNKNOWN";
  message: string;
  nodeId?: string;
};

export type ValidateWorkflowDraftInput = {
  definition: WorkflowDefinitionJson;
  method: string;
  path: string;
};

const allowedMethods = new Set(["DELETE", "GET", "PATCH", "POST", "PUT"]);
const allowedNodeTypes = new Set([
  "branch",
  "createEntry",
  "deleteEntry",
  "getEntry",
  "hashPassword",
  "httpRequest",
  "queryEntries",
  "routeTrigger",
  "returnResponse",
  "setVariable",
  "updateEntry",
  "validateBody",
  "verifyPassword",
]);

export function validateWorkflowDraft(input: ValidateWorkflowDraftInput): WorkflowValidationIssue[] {
  const issues: WorkflowValidationIssue[] = [];
  validateRoute(input.method, input.path, issues);
  const definition = input.definition;
  const nodes = Array.isArray(definition.nodes) ? definition.nodes : undefined;
  const edges = Array.isArray(definition.edges) ? definition.edges : undefined;
  const startNodeId = typeof definition.startNodeId === "string" ? definition.startNodeId : "";
  if (!nodes) {
    issues.push({ code: "WORKFLOW_DEFINITION_INVALID", message: "Workflow definition must include a nodes array." });
    return issues;
  }
  if (!edges) {
    issues.push({ code: "WORKFLOW_DEFINITION_INVALID", message: "Workflow definition must include an edges array." });
  }
  if (!startNodeId) {
    issues.push({ code: "WORKFLOW_DEFINITION_INVALID", message: "Workflow definition must include startNodeId." });
  }
  const nodeIds = new Set<string>();
  for (const node of nodes) {
    if (!isRecord(node)) {
      issues.push({ code: "WORKFLOW_DEFINITION_INVALID", message: "Workflow node must be an object." });
      continue;
    }
    const nodeId = typeof node.id === "string" ? node.id : "";
    const nodeType = typeof node.type === "string" ? node.type : "";
    if (!nodeId) {
      issues.push({ code: "WORKFLOW_DEFINITION_INVALID", message: "Workflow node must include id." });
      continue;
    }
    if (nodeIds.has(nodeId)) {
      issues.push({ code: "WORKFLOW_NODE_DUPLICATE", message: `Workflow node id '${nodeId}' is duplicated.`, nodeId });
    }
    nodeIds.add(nodeId);
    if (!allowedNodeTypes.has(nodeType)) {
      issues.push({ code: "WORKFLOW_NODE_TYPE_UNKNOWN", message: `Workflow node type '${nodeType}' is not supported.`, nodeId });
      continue;
    }
    validateNodeConfig(nodeId, nodeType, node.config, issues);
  }
  if (startNodeId && !nodeIds.has(startNodeId)) {
    issues.push({ code: "WORKFLOW_NODE_DISCONNECTED", message: "Workflow startNodeId does not match any node.", nodeId: startNodeId });
  }
  validateReturnReachability(startNodeId, nodes, edges ?? [], issues);
  return issues;
}

export function assertValidWorkflowDraft(input: ValidateWorkflowDraftInput): void {
  const issues = validateWorkflowDraft(input);
  if (issues.length > 0) {
    const error = new Error(issues[0]?.code ?? "WORKFLOW_DEFINITION_INVALID");
    Object.assign(error, { issues });
    throw error;
  }
}

function validateRoute(method: string, path: string, issues: WorkflowValidationIssue[]): void {
  if (!allowedMethods.has(method.trim().toUpperCase())) {
    issues.push({ code: "WORKFLOW_BAD_ROUTE_CONFIG", message: "Workflow method must be GET, POST, PUT, PATCH, or DELETE." });
  }
  const normalizedPath = normalizeWorkflowPath(path);
  if (!normalizedPath || normalizedPath.includes("://") || normalizedPath.includes("..") || normalizedPath.includes("//")) {
    issues.push({ code: "WORKFLOW_BAD_ROUTE_CONFIG", message: "Workflow path must be a safe path under /api/custom." });
  }
}

function validateNodeConfig(
  nodeId: string,
  nodeType: string,
  config: unknown,
  issues: WorkflowValidationIssue[],
): void {
  if (!isRecord(config)) {
    issues.push({ code: "WORKFLOW_NODE_CONFIG_INVALID", message: "Workflow node config must be an object.", nodeId });
    return;
  }
  if (nodeType === "validateBody" && !isRecord(config.fields)) {
    issues.push({ code: "WORKFLOW_NODE_CONFIG_INVALID", message: "validateBody requires fields config.", nodeId });
  }
  if (nodeType === "queryEntries" && !isNonEmptyString(config.schema)) {
    issues.push({ code: "WORKFLOW_NODE_CONFIG_INVALID", message: "queryEntries requires schema.", nodeId });
  }
  if (nodeType === "getEntry" && !Object.hasOwn(config, "entryId")) {
    issues.push({ code: "WORKFLOW_NODE_CONFIG_INVALID", message: "getEntry requires entryId.", nodeId });
  }
  if (nodeType === "httpRequest") {
    validateHttpRequestConfig(nodeId, config, issues);
  }
  if (nodeType === "hashPassword" && !Object.hasOwn(config, "password")) {
    issues.push({ code: "WORKFLOW_NODE_CONFIG_INVALID", message: "hashPassword requires password.", nodeId });
  }
  if (nodeType === "verifyPassword" && (!Object.hasOwn(config, "password") || !Object.hasOwn(config, "hash"))) {
    issues.push({ code: "WORKFLOW_NODE_CONFIG_INVALID", message: "verifyPassword requires password and hash.", nodeId });
  }
  if (nodeType === "createEntry" && (!isNonEmptyString(config.schema) || !isRecord(config.data))) {
    issues.push({ code: "WORKFLOW_NODE_CONFIG_INVALID", message: "createEntry requires schema and data.", nodeId });
  }
  if (nodeType === "updateEntry" && (!Object.hasOwn(config, "entryId") || !isRecord(config.data))) {
    issues.push({ code: "WORKFLOW_NODE_CONFIG_INVALID", message: "updateEntry requires entryId and data.", nodeId });
  }
  if (nodeType === "deleteEntry" && !Object.hasOwn(config, "entryId")) {
    issues.push({ code: "WORKFLOW_NODE_CONFIG_INVALID", message: "deleteEntry requires entryId.", nodeId });
  }
  if (nodeType === "branch" && (!isRecord(config.condition) || !isNonEmptyString(config.thenNodeId) || !isNonEmptyString(config.elseNodeId))) {
    issues.push({ code: "WORKFLOW_NODE_CONFIG_INVALID", message: "branch requires condition, thenNodeId, and elseNodeId.", nodeId });
  }
  if (nodeType === "setVariable" && !isRecord(config.values)) {
    issues.push({ code: "WORKFLOW_NODE_CONFIG_INVALID", message: "setVariable requires values.", nodeId });
  }
  if (nodeType === "returnResponse" && (typeof config.status !== "number" || !Object.hasOwn(config, "body"))) {
    issues.push({ code: "WORKFLOW_NODE_CONFIG_INVALID", message: "returnResponse requires status and body.", nodeId });
  }
}

function validateHttpRequestConfig(
  nodeId: string,
  config: Record<string, unknown>,
  issues: WorkflowValidationIssue[],
): void {
  const method = typeof config.method === "string" ? config.method.toUpperCase() : "";
  if (!allowedMethods.has(method) || !isNonEmptyString(config.url)) {
    issues.push({ code: "WORKFLOW_NODE_CONFIG_INVALID", message: "httpRequest requires method and url.", nodeId });
  }
  if (typeof config.url === "string" && /^{{.*}}$/.test(config.url.trim())) {
    issues.push({ code: "WORKFLOW_NODE_CONFIG_INVALID", message: "httpRequest url host cannot be fully dynamic.", nodeId });
  }
  if (Object.hasOwn(config, "headers") && !isRecord(config.headers)) {
    issues.push({ code: "WORKFLOW_NODE_CONFIG_INVALID", message: "httpRequest headers must be an object.", nodeId });
  }
  if (Object.hasOwn(config, "query") && !isRecord(config.query)) {
    issues.push({ code: "WORKFLOW_NODE_CONFIG_INVALID", message: "httpRequest query must be an object.", nodeId });
  }
  const timeoutMs = config.timeoutMs;
  if (Object.hasOwn(config, "timeoutMs") && (typeof timeoutMs !== "number" || !Number.isInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 15000)) {
    issues.push({ code: "WORKFLOW_NODE_CONFIG_INVALID", message: "httpRequest timeoutMs must be between 1000 and 15000.", nodeId });
  }
  if (Object.hasOwn(config, "successStatus") && (!Array.isArray(config.successStatus) || !config.successStatus.every(isHttpStatus))) {
    issues.push({ code: "WORKFLOW_NODE_CONFIG_INVALID", message: "httpRequest successStatus must be an array of HTTP status codes.", nodeId });
  }
}

function validateReturnReachability(
  startNodeId: string,
  nodes: unknown[],
  edges: unknown[],
  issues: WorkflowValidationIssue[],
): void {
  const nodeById = new Map<string, string>();
  for (const node of nodes) {
    if (isRecord(node) && typeof node.id === "string" && typeof node.type === "string") {
      nodeById.set(node.id, node.type);
    }
  }
  const adjacency = new Map<string, string[]>();
  for (const edge of edges) {
    if (isRecord(edge) && typeof edge.from === "string" && typeof edge.to === "string") {
      adjacency.set(edge.from, [...(adjacency.get(edge.from) ?? []), edge.to]);
    }
  }
  const queue = startNodeId ? [startNodeId] : [];
  const visited = new Set<string>();
  while (queue.length > 0) {
    const nodeId = queue.shift();
    if (!nodeId || visited.has(nodeId)) continue;
    visited.add(nodeId);
    if (nodeById.get(nodeId) === "returnResponse") return;
    queue.push(...(adjacency.get(nodeId) ?? []));
  }
  issues.push({ code: "WORKFLOW_NODE_DISCONNECTED", message: "Workflow must connect startNodeId to a returnResponse node." });
}

function normalizeWorkflowPath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) return "";
  const rooted = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return rooted.startsWith("/api/custom/") ? rooted : `/api/custom${rooted}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isHttpStatus(value: unknown): boolean {
  return Number.isInteger(value) && typeof value === "number" && value >= 100 && value <= 599;
}
