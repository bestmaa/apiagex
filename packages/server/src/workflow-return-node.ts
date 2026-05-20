import { setWorkflowResponse, setWorkflowStepOutput } from "./workflow-context.js";
import type { WorkflowExecutionContext } from "./workflow-context.js";
import type { WorkflowNodeExecutionResult } from "./workflow-node-result.type.js";
import { resolveWorkflowTemplateString, resolveWorkflowTemplateValue } from "./workflow-template.js";
import type { WorkflowNodeDefinition, WorkflowNodeOutputByType } from "./workflow.type.js";

type ReturnResponseOutput = WorkflowNodeOutputByType["returnResponse"];

export function executeWorkflowReturnResponseNode(
  context: WorkflowExecutionContext,
  node: WorkflowNodeDefinition<"returnResponse">,
): WorkflowNodeExecutionResult<ReturnResponseOutput> {
  try {
    const body = resolveWorkflowTemplateValue(node.config.body, context);
    const headers = resolveHeaders(node.config.headers ?? {}, context);
    const status = normalizeStatus(node.config.status);
    setWorkflowResponse(context, { body, headers, status });
    const output: ReturnResponseOutput = { body, status };
    setWorkflowStepOutput(context, node.id, output);
    return { ok: true, output, shouldStop: false };
  } catch (error) {
    return {
      error: {
        code: "WORKFLOW_NODE_FAILED",
        message: error instanceof Error ? error.message : "Workflow return response node failed.",
        nodeId: node.id,
      },
      nodeId: node.id,
      ok: false,
      shouldStop: true,
    };
  }
}

function resolveHeaders(
  headers: Record<string, string>,
  context: WorkflowExecutionContext,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers).map(([name, value]) => [name.toLowerCase(), String(resolveWorkflowTemplateString(value, context))]),
  );
}

function normalizeStatus(status: number): number {
  if (!Number.isInteger(status) || status < 100 || status > 599) throw new Error("Workflow return status must be 100-599.");
  return status;
}
