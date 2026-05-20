import {
  deleteEntry,
  getEntryById,
  type ApiagexDatabase,
} from "@apiagex/database";
import { setWorkflowStepOutput } from "./workflow-context.js";
import type { WorkflowExecutionContext } from "./workflow-context.js";
import type { WorkflowNodeExecutionResult } from "./workflow-node-result.type.js";
import { resolveWorkflowTemplateValue } from "./workflow-template.js";
import type { WorkflowNodeDefinition, WorkflowNodeOutputByType } from "./workflow.type.js";

type DeleteEntryOutput = WorkflowNodeOutputByType["deleteEntry"];

export async function executeWorkflowDeleteEntryNode(
  db: ApiagexDatabase,
  context: WorkflowExecutionContext,
  node: WorkflowNodeDefinition<"deleteEntry">,
): Promise<WorkflowNodeExecutionResult<DeleteEntryOutput>> {
  try {
    const entryId = String(resolveWorkflowTemplateValue(node.config.entryId, context) ?? "").trim();
    if (!entryId) return deleteEntryFailure(node.id, "WORKFLOW_VALIDATION_FAILED", "deleteEntry requires a resolved entry id.");
    if (!(await getEntryById(db, entryId))) {
      return deleteEntryFailure(node.id, "WORKFLOW_ENTRY_NOT_FOUND", `Entry '${entryId}' was not found.`);
    }
    await deleteEntry(db, entryId);
    const output: DeleteEntryOutput = { deleted: true, entryId };
    setWorkflowStepOutput(context, node.id, output);
    return { ok: true, output, shouldStop: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Workflow delete entry node failed.";
    return deleteEntryFailure(node.id, "WORKFLOW_NODE_FAILED", message);
  }
}

function deleteEntryFailure(
  nodeId: string,
  code: "WORKFLOW_ENTRY_NOT_FOUND" | "WORKFLOW_NODE_FAILED" | "WORKFLOW_VALIDATION_FAILED",
  message: string,
): WorkflowNodeExecutionResult<DeleteEntryOutput> {
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
