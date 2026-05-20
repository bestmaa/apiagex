import { getEntryById, type ApiagexDatabase } from "@apiagex/database";
import { setWorkflowStepOutput } from "./workflow-context.js";
import type { WorkflowExecutionContext } from "./workflow-context.js";
import { entryToWorkflowJson } from "./workflow-entry-json.js";
import type { WorkflowNodeExecutionResult } from "./workflow-node-result.type.js";
import { resolveWorkflowTemplateValue } from "./workflow-template.js";
import type { WorkflowNodeDefinition, WorkflowNodeOutputByType } from "./workflow.type.js";

type GetEntryOutput = WorkflowNodeOutputByType["getEntry"];

export async function executeWorkflowGetEntryNode(
  db: ApiagexDatabase,
  context: WorkflowExecutionContext,
  node: WorkflowNodeDefinition<"getEntry">,
): Promise<WorkflowNodeExecutionResult<GetEntryOutput>> {
  try {
    const entryId = String(resolveWorkflowTemplateValue(node.config.entryId, context) ?? "").trim();
    if (!entryId) return getEntryFailure(node.id, "WORKFLOW_VALIDATION_FAILED", "getEntry requires a resolved entry id.");
    const entry = await getEntryById(db, entryId);
    if (!entry) return getEntryFailure(node.id, "WORKFLOW_ENTRY_NOT_FOUND", `Entry '${entryId}' was not found.`);
    const output: GetEntryOutput = { entry: entryToWorkflowJson(entry) };
    setWorkflowStepOutput(context, node.id, output);
    return { ok: true, output, shouldStop: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Workflow get entry node failed.";
    return getEntryFailure(node.id, "WORKFLOW_NODE_FAILED", message);
  }
}

function getEntryFailure(
  nodeId: string,
  code: "WORKFLOW_ENTRY_NOT_FOUND" | "WORKFLOW_NODE_FAILED" | "WORKFLOW_VALIDATION_FAILED",
  message: string,
): WorkflowNodeExecutionResult<GetEntryOutput> {
  return {
    error: {
      code,
      message,
      nodeId,
    },
    nodeId,
    ok: false,
    shouldStop: true,
  };
}
