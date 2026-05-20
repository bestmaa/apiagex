import type { WorkflowErrorResponse, WorkflowJsonValue, WorkflowNodeId } from "./workflow.type.js";

export type WorkflowNodeExecutionSuccess<TOutput extends WorkflowJsonValue = WorkflowJsonValue> = {
  ok: true;
  output: TOutput;
  shouldStop: false;
};

export type WorkflowNodeExecutionFailure = {
  error: WorkflowErrorResponse["error"];
  nodeId: WorkflowNodeId;
  ok: false;
  shouldStop: boolean;
};

export type WorkflowNodeExecutionResult<TOutput extends WorkflowJsonValue = WorkflowJsonValue> =
  | WorkflowNodeExecutionFailure
  | WorkflowNodeExecutionSuccess<TOutput>;
