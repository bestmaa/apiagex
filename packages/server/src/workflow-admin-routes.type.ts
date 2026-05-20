import type { WorkflowDefinitionJson } from "@apiagex/database";

export type WorkflowParams = {
  workflowId: string;
};

export type CreateWorkflowBody = {
  active?: boolean;
  definition: WorkflowDefinitionJson;
  method: string;
  name: string;
  path: string;
  version: number;
};

export type UpdateWorkflowBody = {
  active?: boolean;
  definition?: WorkflowDefinitionJson;
  method?: string;
  name?: string;
  path?: string;
  version?: number;
};
