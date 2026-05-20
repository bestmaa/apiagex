export type WorkflowRunStatus = "success" | "error";

export type WorkflowRunRequestMetadata = {
  headers: Record<string, string>;
  method: string;
  params: Record<string, unknown>;
  path: string;
  query: Record<string, unknown>;
};

export type WorkflowRunRecord = {
  createdAt: string;
  durationMs: number;
  errorCode: string | null;
  id: string;
  request: WorkflowRunRequestMetadata;
  status: WorkflowRunStatus;
  statusCode: number | null;
  workflowId: string;
};

export type WorkflowRunRequestInput = {
  headers?: Record<string, unknown>;
  method?: unknown;
  params?: Record<string, unknown>;
  path?: unknown;
  query?: Record<string, unknown>;
} & Record<string, unknown>;

export type RecordWorkflowRunInput = {
  durationMs: number;
  errorCode?: string | null;
  request: WorkflowRunRequestInput;
  status: WorkflowRunStatus;
  statusCode?: number | null;
  workflowId: string;
};
