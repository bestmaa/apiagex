import { setWorkflowStepOutput } from "./workflow-context.js";
import type { WorkflowExecutionContext } from "./workflow-context.js";
import type { WorkflowNodeExecutionResult } from "./workflow-node-result.type.js";
import { resolveWorkflowTemplateValue } from "./workflow-template.js";
import type { WorkflowJsonValue, WorkflowNodeDefinition, WorkflowNodeOutputByType } from "./workflow.type.js";

type BranchOutput = WorkflowNodeOutputByType["branch"];

export function executeWorkflowBranchNode(
  context: WorkflowExecutionContext,
  node: WorkflowNodeDefinition<"branch">,
): WorkflowNodeExecutionResult<BranchOutput> {
  try {
    const left = resolveWorkflowTemplateValue(node.config.condition.left, context);
    const right = Object.hasOwn(node.config.condition, "right")
      ? resolveWorkflowTemplateValue(node.config.condition.right ?? null, context)
      : undefined;
    const matched = evaluateBranchCondition(left, node.config.condition.operator, right);
    const output: BranchOutput = {
      matched,
      nextNodeId: matched ? node.config.thenNodeId : node.config.elseNodeId,
    };
    setWorkflowStepOutput(context, node.id, output);
    return { ok: true, output, shouldStop: false };
  } catch (error) {
    return {
      error: {
        code: "WORKFLOW_NODE_FAILED",
        message: error instanceof Error ? error.message : "Workflow branch node failed.",
        nodeId: node.id,
      },
      nodeId: node.id,
      ok: false,
      shouldStop: true,
    };
  }
}

export function evaluateBranchCondition(
  left: WorkflowJsonValue,
  operator: WorkflowNodeDefinition<"branch">["config"]["condition"]["operator"],
  right?: WorkflowJsonValue,
): boolean {
  if (operator === "exists") return !isEmptyValue(left);
  if (operator === "empty") return isEmptyValue(left);
  if (operator === "notEmpty") return !isEmptyValue(left);
  if (operator === "eq") return jsonEquals(left, right ?? null);
  if (operator === "neq") return !jsonEquals(left, right ?? null);
  if (operator === "contains") return String(left ?? "").includes(String(right ?? ""));
  if (operator === "gt") return compareValues(left, right) > 0;
  if (operator === "gte") return compareValues(left, right) >= 0;
  if (operator === "lt") return compareValues(left, right) < 0;
  if (operator === "lte") return compareValues(left, right) <= 0;
  return false;
}

function isEmptyValue(value: WorkflowJsonValue): boolean {
  if (value === null || value === "") return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}

function jsonEquals(left: WorkflowJsonValue, right: WorkflowJsonValue): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function compareValues(left: WorkflowJsonValue, right: WorkflowJsonValue | undefined): number {
  if (typeof left === "number" && typeof right === "number") return left - right;
  return String(left ?? "").localeCompare(String(right ?? ""));
}
