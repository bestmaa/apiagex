import type { WorkflowDefinitionJson } from "@apiagex/database";

export type WorkflowParams = {
  workflowId: string;
};

export type CreateWorkflowBody = {
  active?: boolean;
  definition: WorkflowDefinitionJson;
  description?: string;
  method: string;
  name: string;
  path: string;
  version: number;
};

export type UpdateWorkflowBody = {
  active?: boolean;
  definition?: WorkflowDefinitionJson;
  description?: string;
  method?: string;
  name?: string;
  path?: string;
  version?: number;
};
