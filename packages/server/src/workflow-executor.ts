import type { ApiagexDatabase } from "@apiagex/database";
import { setWorkflowStepOutput, setWorkflowVariable } from "./workflow-context.js";
import type { WorkflowExecutionContext } from "./workflow-context.js";
import { executeWorkflowBranchNode } from "./workflow-branch-node.js";
import { executeWorkflowCreateEntryNode } from "./workflow-create-entry-node.js";
import { executeWorkflowDeleteEntryNode } from "./workflow-delete-entry-node.js";
import { executeWorkflowGetEntryNode } from "./workflow-get-entry-node.js";
import { executeWorkflowHttpRequestNode, type WorkflowHttpRequestOptions } from "./workflow-http-request-node.js";
import { executeWorkflowHashPasswordNode, executeWorkflowVerifyPasswordNode } from "./workflow-password-node.js";
import type {
  WorkflowNodeExecutionFailure,
  WorkflowNodeExecutionResult,
  WorkflowNodeExecutionSuccess,
} from "./workflow-node-result.type.js";
import { executeWorkflowQueryEntriesNode } from "./workflow-query-node.js";
import { executeWorkflowReturnResponseNode } from "./workflow-return-node.js";
import {
  resolveWorkflowRuntimeLimits,
  workflowResponseBytes,
  workflowTimedOut,
  type WorkflowRuntimeLimitOptions,
  type WorkflowRuntimeLimits,
} from "./workflow-runtime-limits.js";
import { resolveWorkflowTemplateValue } from "./workflow-template.js";
import { executeWorkflowUpdateEntryNode } from "./workflow-update-entry-node.js";
import { executeWorkflowValidateBodyNode } from "./workflow-validate-body-node.js";
import type {
  AnyWorkflowNodeDefinition,
  WorkflowDefinition,
  WorkflowJsonValue,
  WorkflowNodeDefinition,
  WorkflowNodeOutputByType,
} from "./workflow.type.js";

export type WorkflowExecutorOptions = WorkflowRuntimeLimitOptions & {
  httpRequest?: WorkflowHttpRequestOptions;
};

export type WorkflowExecutionSuccess = {
  context: WorkflowExecutionContext;
  executedNodeIds: string[];
  ok: true;
  response: WorkflowExecutionContext["response"];
};

export type WorkflowExecutionResult = WorkflowExecutionFailure | WorkflowExecutionSuccess;

export type WorkflowExecutionFailure = WorkflowNodeExecutionFailure & {
  context: WorkflowExecutionContext;
  executedNodeIds: string[];
};

export async function executeWorkflowDefinition(
  db: ApiagexDatabase,
  context: WorkflowExecutionContext,
  definition: WorkflowDefinition,
  options: WorkflowExecutorOptions = {},
): Promise<WorkflowExecutionResult> {
  const limits = resolveWorkflowRuntimeLimits(options);
  const startedAtMs = Date.now();
  const nodeById = new Map(definition.nodes.map((node) => [node.id, node]));
  const nextByNodeId = new Map(definition.edges.map((edge) => [edge.from, edge.to]));
  const executedNodeIds: string[] = [];
  let currentNodeId: string | undefined = definition.startNodeId;

  for (let count = 0; currentNodeId; count += 1) {
    const timeoutFailure = workflowTimeoutFailure(context, executedNodeIds, currentNodeId, startedAtMs, limits);
    if (timeoutFailure) return timeoutFailure;
    if (count >= limits.maxNodeExecutions) {
      return workflowExecutionFailure(context, executedNodeIds, currentNodeId, "WORKFLOW_LIMIT_EXCEEDED", `Workflow node execution limit exceeded (${limits.maxNodeExecutions}).`);
    }
    const node = nodeById.get(currentNodeId);
    if (!node) {
      return workflowExecutionFailure(context, executedNodeIds, currentNodeId, "WORKFLOW_DEFINITION_INVALID", `Workflow node '${currentNodeId}' was not found.`);
    }
    executedNodeIds.push(node.id);
    const result = await executeWorkflowNode(db, context, node, limits, options.httpRequest);
    if (!result.ok) return { ...result, context, executedNodeIds };
    const postNodeTimeoutFailure = workflowTimeoutFailure(context, executedNodeIds, node.id, startedAtMs, limits);
    if (postNodeTimeoutFailure) return postNodeTimeoutFailure;
    if (node.type === "returnResponse") {
      const responseBytes = workflowResponseBytes(context.response.body);
      if (responseBytes > limits.maxResponseBytes) {
        return workflowExecutionFailure(
          context,
          executedNodeIds,
          node.id,
          "WORKFLOW_LIMIT_EXCEEDED",
          `Workflow response size limit exceeded (${responseBytes}/${limits.maxResponseBytes} bytes).`,
        );
      }
      return { context, executedNodeIds, ok: true, response: context.response };
    }
    if (node.type === "branch") {
      currentNodeId = (result as WorkflowNodeExecutionSuccess<WorkflowNodeOutputByType["branch"]>).output.nextNodeId;
    } else {
      currentNodeId = nextByNodeId.get(node.id);
    }
  }

  return workflowExecutionFailure(context, executedNodeIds, definition.startNodeId, "WORKFLOW_DEFINITION_INVALID", "Workflow completed without a returnResponse node.");
}

async function executeWorkflowNode(
  db: ApiagexDatabase,
  context: WorkflowExecutionContext,
  node: AnyWorkflowNodeDefinition,
  limits: WorkflowRuntimeLimits,
  httpRequestOptions: WorkflowHttpRequestOptions = {},
): Promise<WorkflowNodeExecutionResult> {
  if (node.type === "routeTrigger") return executeRouteTriggerNode(context, node);
  if (node.type === "validateBody") return executeWorkflowValidateBodyNode(context, node);
  if (node.type === "queryEntries") return executeWorkflowQueryEntriesNode(db, context, node, { maxLimit: limits.maxQueryLimit });
  if (node.type === "getEntry") return executeWorkflowGetEntryNode(db, context, node);
  if (node.type === "createEntry") return executeWorkflowCreateEntryNode(db, context, node);
  if (node.type === "updateEntry") return executeWorkflowUpdateEntryNode(db, context, node);
  if (node.type === "deleteEntry") return executeWorkflowDeleteEntryNode(db, context, node);
  if (node.type === "httpRequest") return executeWorkflowHttpRequestNode(context, node, httpRequestOptions);
  if (node.type === "hashPassword") return executeWorkflowHashPasswordNode(context, node);
  if (node.type === "verifyPassword") return executeWorkflowVerifyPasswordNode(context, node);
  if (node.type === "branch") return executeWorkflowBranchNode(context, node);
  if (node.type === "setVariable") return executeSetVariableNode(context, node);
  if (node.type === "returnResponse") return executeWorkflowReturnResponseNode(context, node);
  const unexpected = node as { id: string; type: string };
  return workflowExecutionFailure(context, [], unexpected.id, "WORKFLOW_DEFINITION_INVALID", `Workflow node type '${unexpected.type}' is not supported.`);
}

function workflowTimeoutFailure(
  context: WorkflowExecutionContext,
  executedNodeIds: string[],
  nodeId: string,
  startedAtMs: number,
  limits: WorkflowRuntimeLimits,
): WorkflowExecutionFailure | undefined {
  if (!workflowTimedOut(startedAtMs, limits.timeoutMs)) return undefined;
  return workflowExecutionFailure(
    context,
    executedNodeIds,
    nodeId,
    "WORKFLOW_LIMIT_EXCEEDED",
    `Workflow timeout exceeded (${limits.timeoutMs}ms).`,
  );
}

function executeRouteTriggerNode(
  context: WorkflowExecutionContext,
  node: WorkflowNodeDefinition<"routeTrigger">,
): WorkflowNodeExecutionResult {
  const output = {
    body: context.body,
    headers: context.headers,
    params: context.params,
    query: context.query,
  };
  setWorkflowStepOutput(context, node.id, output);
  return { ok: true, output, shouldStop: false };
}

function executeSetVariableNode(
  context: WorkflowExecutionContext,
  node: WorkflowNodeDefinition<"setVariable">,
): WorkflowNodeExecutionResult {
  const values: Record<string, WorkflowJsonValue> = {};
  for (const [key, value] of Object.entries(node.config.values)) {
    const resolved = resolveWorkflowTemplateValue(value, context);
    values[key] = resolved;
    setWorkflowVariable(context, key, resolved);
  }
  const output = { values };
  setWorkflowStepOutput(context, node.id, output);
  return { ok: true, output, shouldStop: false };
}

function workflowExecutionFailure(
  context: WorkflowExecutionContext,
  executedNodeIds: string[],
  nodeId: string,
  code: WorkflowNodeExecutionFailure["error"]["code"],
  message: string,
): WorkflowExecutionFailure {
  return {
    context,
    error: {
      code,
      message,
      nodeId,
    },
    executedNodeIds,
    nodeId,
    ok: false,
    shouldStop: true,
  };
}
