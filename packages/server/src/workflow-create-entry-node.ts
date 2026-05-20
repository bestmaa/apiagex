import {
  createEntry,
  getSchemaBySlug,
  type ApiagexDatabase,
} from "@apiagex/database";
import { setWorkflowStepOutput } from "./workflow-context.js";
import type { WorkflowExecutionContext } from "./workflow-context.js";
import { entryToWorkflowJson, workflowJsonObjectToEntryData } from "./workflow-entry-json.js";
import type { WorkflowNodeExecutionResult } from "./workflow-node-result.type.js";
import { resolveWorkflowTemplateValue } from "./workflow-template.js";
import type { WorkflowNodeDefinition, WorkflowNodeOutputByType } from "./workflow.type.js";

type CreateEntryOutput = WorkflowNodeOutputByType["createEntry"];

export async function executeWorkflowCreateEntryNode(
  db: ApiagexDatabase,
  context: WorkflowExecutionContext,
  node: WorkflowNodeDefinition<"createEntry">,
): Promise<WorkflowNodeExecutionResult<CreateEntryOutput>> {
  try {
    const schema = await getSchemaBySlug(db, node.config.schema);
    if (!schema) return createEntryFailure(node.id, "WORKFLOW_SCHEMA_NOT_FOUND", `Schema '${node.config.schema}' was not found.`);
    const data = workflowJsonObjectToEntryData(resolveWorkflowTemplateValue(node.config.data, context));
    const entry = await createEntry(db, { data, schemaId: schema.id });
    const output: CreateEntryOutput = { entry: entryToWorkflowJson(entry) };
    setWorkflowStepOutput(context, node.id, output);
    return { ok: true, output, shouldStop: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Workflow create entry node failed.";
    return createEntryFailure(node.id, "WORKFLOW_NODE_FAILED", message);
  }
}

function createEntryFailure(
  nodeId: string,
  code: "WORKFLOW_NODE_FAILED" | "WORKFLOW_SCHEMA_NOT_FOUND",
  message: string,
): WorkflowNodeExecutionResult<CreateEntryOutput> {
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
