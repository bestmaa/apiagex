import { setWorkflowStepOutput } from "./workflow-context.js";
import type { WorkflowExecutionContext } from "./workflow-context.js";
import type { WorkflowNodeExecutionResult } from "./workflow-node-result.type.js";
import type {
  WorkflowBodyValidationFieldRule,
  WorkflowNodeDefinition,
  WorkflowNodeOutputByType,
} from "./workflow.type.js";

type ValidateBodyOutput = WorkflowNodeOutputByType["validateBody"];

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function executeWorkflowValidateBodyNode(
  context: WorkflowExecutionContext,
  node: WorkflowNodeDefinition<"validateBody">,
): WorkflowNodeExecutionResult<ValidateBodyOutput> {
  const body = context.body;
  if (!isRecord(body)) return validationFailure(context, node, "body", "Request body must be an object.");

  for (const [field, rule] of Object.entries(node.config.fields)) {
    const value = body[field];
    const missing = value === undefined || value === null || value === "";
    if (rule.required && missing) {
      return validationFailure(context, node, field, "Field is required.");
    }
    if (missing) continue;
    const issue = validateFieldValue(value, rule);
    if (issue) return validationFailure(context, node, field, issue);
  }

  const output: ValidateBodyOutput = { valid: true };
  setWorkflowStepOutput(context, node.id, output);
  return { ok: true, output, shouldStop: false };
}

function validateFieldValue(value: unknown, rule: WorkflowBodyValidationFieldRule): string | undefined {
  if (!matchesType(value, rule.type)) return `Field must be ${rule.type}.`;
  if (rule.type === "email" && typeof value === "string" && !emailPattern.test(value)) {
    return "Field must be a valid email.";
  }
  if (typeof value === "string" && typeof rule.minLength === "number" && value.length < rule.minLength) {
    return `Field must be at least ${rule.minLength} characters.`;
  }
  if (typeof value === "string" && typeof rule.maxLength === "number" && value.length > rule.maxLength) {
    return `Field must be at most ${rule.maxLength} characters.`;
  }
  if (rule.enum && !rule.enum.some((item) => item === value)) {
    return "Field must match one of the allowed values.";
  }
  return undefined;
}

function validationFailure(
  context: WorkflowExecutionContext,
  node: WorkflowNodeDefinition<"validateBody">,
  field: string,
  message: string,
): WorkflowNodeExecutionResult<ValidateBodyOutput> {
  const shouldStop = node.config.onFailure !== "continue";
  setWorkflowStepOutput(context, node.id, { valid: false });
  return {
    error: {
      code: "WORKFLOW_VALIDATION_FAILED",
      details: { field },
      message,
      nodeId: node.id,
    },
    nodeId: node.id,
    ok: false,
    shouldStop,
  };
}

function matchesType(value: unknown, type: WorkflowBodyValidationFieldRule["type"]): boolean {
  if (type === "array") return Array.isArray(value);
  if (type === "boolean") return typeof value === "boolean";
  if (type === "email") return typeof value === "string";
  if (type === "number") return typeof value === "number" && Number.isFinite(value);
  if (type === "object") return isRecord(value);
  return typeof value === "string";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
