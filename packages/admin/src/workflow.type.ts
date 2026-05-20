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
