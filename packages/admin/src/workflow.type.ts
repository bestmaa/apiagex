export type WorkflowAuditActor = {
  email: string;
  id: string;
};

export type WorkflowRecord = {
  active: boolean;
  createdAt: string;
  createdBy: WorkflowAuditActor | null;
  definition: Record<string, unknown>;
  description: string;
  id: string;
  lastRunAt: string | null;
  method: string;
  name: string;
  path: string;
  updatedAt: string;
  updatedBy: WorkflowAuditActor | null;
  version: number;
};

export type WorkflowListResponse = {
  error?: string;
  ok: boolean;
  workflows?: WorkflowRecord[];
};

export type WorkflowMutationResponse = {
  error?: string;
  ok: boolean;
  workflow?: WorkflowRecord;
};

export type WorkflowDraft = {
  active: boolean;
  definition: Record<string, unknown>;
  description: string;
  method: string;
  name: string;
  path: string;
  version: number;
};

export type WorkflowTestRunDraft = {
  body?: unknown;
  headers?: Record<string, unknown>;
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
};

export type WorkflowTestRunResult = {
  error: Record<string, unknown> | null;
  executedNodeIds: string[];
  ok: boolean;
  response: Record<string, unknown>;
  steps: Record<string, unknown>;
};

export type WorkflowTestRunResponse = {
  error?: string;
  ok: boolean;
  result?: WorkflowTestRunResult;
  workflow?: {
    active: boolean;
    id: string;
    method: string;
    path: string;
  };
};

export type WorkflowRunRecord = {
  createdAt: string;
  durationMs: number;
  errorCode: string | null;
  id: string;
  request: {
    headers: Record<string, string>;
    method: string;
    params: Record<string, unknown>;
    path: string;
    query: Record<string, unknown>;
  };
  status: "error" | "success";
  statusCode: number | null;
  workflowId: string;
};

export type WorkflowRunListResponse = {
  error?: string;
  ok: boolean;
  runs?: WorkflowRunRecord[];
};
