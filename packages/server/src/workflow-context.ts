import type { WorkflowJsonValue, WorkflowNodeId } from "./workflow.type.js";

export type WorkflowRequestHeaders = Record<string, string | string[] | undefined>;

export type WorkflowExecutionContextInput = {
  body?: WorkflowJsonValue;
  headers?: WorkflowRequestHeaders;
  includeSensitiveHeaders?: boolean;
  params?: Record<string, string>;
  query?: Record<string, WorkflowJsonValue>;
};

export type WorkflowResponseDraft = {
  body?: WorkflowJsonValue;
  headers: Record<string, string>;
  status?: number;
};

export type WorkflowExecutionContext = {
  body: WorkflowJsonValue;
  headers: Record<string, string>;
  params: Record<string, string>;
  query: Record<string, WorkflowJsonValue>;
  response: WorkflowResponseDraft;
  steps: Record<WorkflowNodeId, WorkflowJsonValue>;
  vars: Record<string, WorkflowJsonValue>;
};

const sensitiveHeaders = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "x-apiagex-api-token",
  "x-apiagex-owner-token",
  "x-apiagex-realtime-session",
  "x-apiagex-role-id",
]);

export function createWorkflowExecutionContext(
  input: WorkflowExecutionContextInput = {},
): WorkflowExecutionContext {
  return {
    body: input.body ?? null,
    headers: sanitizeWorkflowHeaders(input.headers ?? {}, input.includeSensitiveHeaders === true),
    params: { ...(input.params ?? {}) },
    query: { ...(input.query ?? {}) },
    response: { headers: {} },
    steps: {},
    vars: {},
  };
}

export function sanitizeWorkflowHeaders(
  headers: WorkflowRequestHeaders,
  includeSensitiveHeaders = false,
): Record<string, string> {
  const sanitized: Record<string, string> = {};
  for (const [rawName, rawValue] of Object.entries(headers)) {
    const name = rawName.toLowerCase();
    if (!name || (!includeSensitiveHeaders && sensitiveHeaders.has(name))) continue;
    const value = Array.isArray(rawValue) ? rawValue.join(", ") : rawValue;
    if (typeof value === "string") sanitized[name] = value;
  }
  return sanitized;
}

export function setWorkflowStepOutput(
  context: WorkflowExecutionContext,
  nodeId: WorkflowNodeId,
  output: WorkflowJsonValue,
): WorkflowExecutionContext {
  context.steps[nodeId] = output;
  return context;
}

export function setWorkflowVariable(
  context: WorkflowExecutionContext,
  key: string,
  value: WorkflowJsonValue,
): WorkflowExecutionContext {
  context.vars[key] = value;
  return context;
}

export function setWorkflowResponse(
  context: WorkflowExecutionContext,
  response: {
    body?: WorkflowJsonValue;
    headers?: Record<string, string>;
    status?: number;
  },
): WorkflowExecutionContext {
  const next: WorkflowResponseDraft = { headers: { ...(response.headers ?? {}) } };
  if ("body" in response) next.body = response.body;
  if (typeof response.status === "number") next.status = response.status;
  context.response = next;
  return context;
}
