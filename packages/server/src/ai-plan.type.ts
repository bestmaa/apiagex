import type { WorkflowDefinition, WorkflowHttpMethod, WorkflowJsonValue } from "./workflow.type.js";
import type { ApiagexMcpSchemaFieldInput } from "./mcp-tool-contract.type.js";

export const APIAGEX_AI_PLAN_VERSION = 1;

export type ApiagexAiPlan = {
  version: typeof APIAGEX_AI_PLAN_VERSION;
  title: string;
  summary: string;
  operations: ApiagexAiPlanOperation[];
  tests?: ApiagexAiPlanTestCall[] | undefined;
  notes?: string[] | undefined;
};

export type ApiagexAiPlanOperation =
  | ApiagexAiPlanCreateSchemaOperation
  | ApiagexAiPlanCreateWorkflowOperation
  | ApiagexAiPlanSetPermissionOperation
  | ApiagexAiPlanSeedDataOperation;

export type ApiagexAiPlanBaseOperation = {
  id: string;
  reason: string;
};

export type ApiagexAiPlanCreateSchemaOperation = ApiagexAiPlanBaseOperation & {
  kind: "createSchema";
  schema: {
    name: string;
    slug: string;
    description?: string | undefined;
    fields: ApiagexMcpSchemaFieldInput[];
  };
};

export type ApiagexAiPlanCreateWorkflowOperation = ApiagexAiPlanBaseOperation & {
  kind: "createWorkflowApi";
  workflow: {
    active?: boolean | undefined;
    definition: WorkflowDefinition;
    description?: string | undefined;
    method: WorkflowHttpMethod;
    name: string;
    path: string;
  };
};

export type ApiagexAiPlanSetPermissionOperation = ApiagexAiPlanBaseOperation & {
  kind: "setPermission";
  permission: {
    allowed: boolean;
    permissionKey: string;
    roleId: string;
  };
};

export type ApiagexAiPlanSeedDataOperation = ApiagexAiPlanBaseOperation & {
  kind: "seedData";
  seed: {
    entries: Array<{
      data: Record<string, WorkflowJsonValue>;
      schemaSlug: string;
    }>;
  };
};

export type ApiagexAiPlanTestCall = {
  id: string;
  expectedStatus?: number | undefined;
  method: WorkflowHttpMethod;
  path: string;
  body?: WorkflowJsonValue | undefined;
  headers?: Record<string, string> | undefined;
};

export type ApiagexAiPlanPreview = {
  ok: true;
  plan: ApiagexAiPlan;
  warnings: string[];
  operations: Array<{
    id: string;
    kind: ApiagexAiPlanOperation["kind"];
    summary: string;
  }>;
};

export type ApiagexAiPlanApplyResult = {
  ok: true;
  appliedOperationIds: string[];
  skippedOperationIds: string[];
  summary: string;
};
