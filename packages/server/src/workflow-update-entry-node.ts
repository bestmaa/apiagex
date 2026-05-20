import {
  getEntryById,
  updateEntry,
  type ApiagexDatabase,
} from "@apiagex/database";
import { setWorkflowStepOutput } from "./workflow-context.js";
import type { WorkflowExecutionContext } from "./workflow-context.js";
import { entryToWorkflowJson, workflowJsonObjectToEntryData } from "./workflow-entry-json.js";
import type { WorkflowNodeExecutionResult } from "./workflow-node-result.type.js";
import { resolveWorkflowTemplateValue } from "./workflow-template.js";
import type { WorkflowNodeDefinition, WorkflowNodeOutputByType } from "./workflow.type.js";

type UpdateEntryOutput = WorkflowNodeOutputByType["updateEntry"];

export async function executeWorkflowUpdateEntryNode(
  db: ApiagexDatabase,
  context: WorkflowExecutionContext,
  node: WorkflowNodeDefinition<"updateEntry">,
): Promise<WorkflowNodeExecutionResult<UpdateEntryOutput>> {
  try {
    const entryId = String(resolveWorkflowTemplateValue(node.config.entryId, context) ?? "").trim();
    if (!entryId) return updateEntryFailure(node.id, "WORKFLOW_VALIDATION_FAILED", "updateEntry requires a resolved entry id.");
    if (!(await getEntryById(db, entryId))) {
      return updateEntryFailure(node.id, "WORKFLOW_ENTRY_NOT_FOUND", `Entry '${entryId}' was not found.`);
    }
    const data = workflowJsonObjectToEntryData(resolveWorkflowTemplateValue(node.config.data, context));
    const entry = await updateEntry(db, entryId, { data });
    const output: UpdateEntryOutput = { entry: entryToWorkflowJson(entry) };
    setWorkflowStepOutput(context, node.id, output);
    return { ok: true, output, shouldStop: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Workflow update entry node failed.";
    return updateEntryFailure(node.id, "WORKFLOW_NODE_FAILED", message);
  }
}

function updateEntryFailure(
  nodeId: string,
  code: "WORKFLOW_ENTRY_NOT_FOUND" | "WORKFLOW_NODE_FAILED" | "WORKFLOW_VALIDATION_FAILED",
  message: string,
): WorkflowNodeExecutionResult<UpdateEntryOutput> {
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
