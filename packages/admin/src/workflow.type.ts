export type WorkflowAuditActor = {
  email: string;
  id: string;
};

export type WorkflowRecord = {
  active: boolean;
  createdAt: string;
  createdBy: WorkflowAuditActor | null;
  definition: Record<string, unknown>;
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
