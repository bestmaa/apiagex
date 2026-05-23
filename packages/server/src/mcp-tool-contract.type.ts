import type { AutomationTokenScope } from "@apiagex/database";
import type { WorkflowDefinition, WorkflowHttpMethod } from "./workflow.type.js";

export const APIAGEX_MCP_TOOL_NAMES = [
  "apiagex.health",
  "apiagex.list_schemas",
  "apiagex.create_schema",
  "apiagex.create_workflow_api",
  "apiagex.test_workflow",
  "apiagex.list_routes",
  "apiagex.set_permission",
  "apiagex.export_summary",
] as const;

export type ApiagexMcpToolName = typeof APIAGEX_MCP_TOOL_NAMES[number];

export type ApiagexMcpToolContract = {
  name: ApiagexMcpToolName;
  description: string;
  requiredScopes: AutomationTokenScope[];
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
};

export type ApiagexMcpHealthInput = Record<string, never>;

export type ApiagexMcpHealthOutput = {
  ok: true;
  service: "apiagex";
  baseUrl: string;
};

export type ApiagexMcpListSchemasInput = Record<string, never>;

export type ApiagexMcpSchemaFieldInput = {
  name: string;
  slug: string;
  type:
    | "text"
    | "longText"
    | "number"
    | "boolean"
    | "date"
    | "datetime"
    | "time"
    | "email"
    | "url"
    | "integer"
    | "decimal"
    | "currency"
    | "enum"
    | "multiSelect"
    | "password"
    | "richText"
    | "json"
    | "media"
    | "file"
    | "image"
    | "relation";
  options?: string[] | undefined;
  required?: boolean | undefined;
  relationSchemaId?: string | undefined;
  relationType?: "oneToOne" | "oneToMany" | "manyToOne" | "manyToMany" | undefined;
};

export type ApiagexMcpCreateSchemaInput = {
  name: string;
  slug: string;
  description?: string | undefined;
  fields: ApiagexMcpSchemaFieldInput[];
};

export type ApiagexMcpSchemaSummary = {
  id: string;
  name: string;
  slug: string;
  fieldCount: number;
};

export type ApiagexMcpCreateSchemaOutput = {
  ok: true;
  schema: ApiagexMcpSchemaSummary;
};

export type ApiagexMcpListSchemasOutput = {
  ok: true;
  schemas: ApiagexMcpSchemaSummary[];
};

export type ApiagexMcpCreateWorkflowApiInput = {
  name: string;
  method: WorkflowHttpMethod;
  path: string;
  description?: string | undefined;
  active?: boolean | undefined;
  definition: WorkflowDefinition;
};

export type ApiagexMcpWorkflowSummary = {
  id: string;
  name: string;
  method: WorkflowHttpMethod;
  path: string;
  active: boolean;
};

export type ApiagexMcpCreateWorkflowApiOutput = {
  ok: true;
  workflow: ApiagexMcpWorkflowSummary;
};

export type ApiagexMcpTestWorkflowInput = {
  workflowId?: string | undefined;
  method?: WorkflowHttpMethod | undefined;
  path?: string | undefined;
  headers?: Record<string, string> | undefined;
  body?: unknown;
};

export type ApiagexMcpTestWorkflowOutput = {
  ok: boolean;
  statusCode: number;
  body: unknown;
};

export type ApiagexMcpListRoutesInput = Record<string, never>;

export type ApiagexMcpRouteSummary = {
  id: string;
  method: string;
  path: string;
  permissionKey: string;
  active: boolean;
};

export type ApiagexMcpListRoutesOutput = {
  ok: true;
  routes: ApiagexMcpRouteSummary[];
};

export type ApiagexMcpSetPermissionInput = {
  permissionKey: string;
  roleId: string;
  allowed: boolean;
};

export type ApiagexMcpSetPermissionOutput = {
  ok: true;
  permissionKey: string;
  roleId: string;
  allowed: boolean;
};

export type ApiagexMcpExportSummaryInput = Record<string, never>;

export type ApiagexMcpExportSummaryOutput = {
  ok: true;
  markdown: string;
};

export type ApiagexMcpToolInputByName = {
  "apiagex.health": ApiagexMcpHealthInput;
  "apiagex.list_schemas": ApiagexMcpListSchemasInput;
  "apiagex.create_schema": ApiagexMcpCreateSchemaInput;
  "apiagex.create_workflow_api": ApiagexMcpCreateWorkflowApiInput;
  "apiagex.test_workflow": ApiagexMcpTestWorkflowInput;
  "apiagex.list_routes": ApiagexMcpListRoutesInput;
  "apiagex.set_permission": ApiagexMcpSetPermissionInput;
  "apiagex.export_summary": ApiagexMcpExportSummaryInput;
};

export type ApiagexMcpToolOutputByName = {
  "apiagex.health": ApiagexMcpHealthOutput;
  "apiagex.list_schemas": ApiagexMcpListSchemasOutput;
  "apiagex.create_schema": ApiagexMcpCreateSchemaOutput;
  "apiagex.create_workflow_api": ApiagexMcpCreateWorkflowApiOutput;
  "apiagex.test_workflow": ApiagexMcpTestWorkflowOutput;
  "apiagex.list_routes": ApiagexMcpListRoutesOutput;
  "apiagex.set_permission": ApiagexMcpSetPermissionOutput;
  "apiagex.export_summary": ApiagexMcpExportSummaryOutput;
};
