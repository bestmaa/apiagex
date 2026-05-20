export type WorkflowDefinitionJson = Record<string, unknown>;

export type WorkflowRecord = {
  active: boolean;
  createdAt: string;
  definition: WorkflowDefinitionJson;
  id: string;
  lastRunAt: string | null;
  method: string;
  name: string;
  path: string;
  updatedAt: string;
  version: number;
};

export type CreateWorkflowInput = {
  active?: boolean;
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
  version?: number;
};
