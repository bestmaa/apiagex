export type WorkflowDefinitionJson = Record<string, unknown>;

export type WorkflowAuditActor = {
  email: string;
  id: string;
};

export type WorkflowRecord = {
  active: boolean;
  createdAt: string;
  createdBy: WorkflowAuditActor | null;
  definition: WorkflowDefinitionJson;
  id: string;
  lastRunAt: string | null;
  method: string;
  name: string;
  path: string;
  updatedAt: string;
  updatedBy: WorkflowAuditActor | null;
  version: number;
};

export type CreateWorkflowInput = {
  active?: boolean;
  createdBy?: WorkflowAuditActor;
  definition: WorkflowDefinitionJson;
  method: string;
  name: string;
  path: string;
  version: number;
};

export type UpdateWorkflowInput = {
  active?: boolean;
  definition?: WorkflowDefinitionJson;
  method?: string;
  name?: string;
  path?: string;
  updatedBy?: WorkflowAuditActor;
  version?: number;
};
