import {
  getSchemaBySlug,
  listEntries,
  type ApiagexDatabase,
  type EntryRecord,
} from "@apiagex/database";
import { setWorkflowStepOutput } from "./workflow-context.js";
import type { WorkflowExecutionContext } from "./workflow-context.js";
import { entryToWorkflowJson } from "./workflow-entry-json.js";
import type { WorkflowNodeExecutionResult } from "./workflow-node-result.type.js";
import { resolveWorkflowTemplateValue, WorkflowTemplateError } from "./workflow-template.js";
import type {
  WorkflowEntryFilter,
  WorkflowNodeDefinition,
  WorkflowNodeOutputByType,
} from "./workflow.type.js";

type QueryEntriesOutput = WorkflowNodeOutputByType["queryEntries"];

export async function executeWorkflowQueryEntriesNode(
  db: ApiagexDatabase,
  context: WorkflowExecutionContext,
  node: WorkflowNodeDefinition<"queryEntries">,
): Promise<WorkflowNodeExecutionResult<QueryEntriesOutput>> {
  try {
    const schema = await getSchemaBySlug(db, node.config.schema);
    if (!schema) return workflowQueryFailure(node.id, "WORKFLOW_SCHEMA_NOT_FOUND", `Schema '${node.config.schema}' was not found.`);

    const search = node.config.search === undefined
      ? ""
      : String(resolveWorkflowTemplateValue(node.config.search, context) ?? "").trim();
    const filters = resolveFilters(node.config.filters ?? [], context);
    const offset = Math.max(0, Math.floor(node.config.offset ?? 0));
    const limit = clampLimit(node.config.limit);
    const allEntries = await listEntries(db, schema.id);
    const filtered = allEntries
      .filter((entry) => matchesSearch(entry, search))
      .filter((entry) => filters.every((filter) => matchesFilter(entry, filter)));
    const entries = filtered.slice(offset, offset + limit).map(entryToWorkflowJson);
    const output: QueryEntriesOutput = {
      entries,
      limit,
      offset,
      total: filtered.length,
    };
    setWorkflowStepOutput(context, node.id, output);
    return { ok: true, output, shouldStop: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Workflow query node failed.";
    return workflowQueryFailure(node.id, "WORKFLOW_NODE_FAILED", message);
  }
}

function resolveFilters(
  filters: WorkflowEntryFilter[],
  context: WorkflowExecutionContext,
): WorkflowEntryFilter[] {
  return filters.map((filter) => ({
    ...filter,
    ...(Object.hasOwn(filter, "value")
      ? { value: resolveWorkflowTemplateValue(filter.value ?? null, context) }
      : {}),
  }));
}

function matchesSearch(entry: EntryRecord, search: string): boolean {
  if (!search) return true;
  const haystack = `${entry.id} ${JSON.stringify(entry.data)}`.toLowerCase();
  return haystack.includes(search.toLowerCase());
}

function matchesFilter(entry: EntryRecord, filter: WorkflowEntryFilter): boolean {
  const value = entry.data[filter.field];
  const expected = Object.hasOwn(filter, "value") ? filter.value : undefined;
  if (filter.operator === "exists") return value !== undefined && value !== null && value !== "";
  if (filter.operator === "eq") return value === expected;
  if (filter.operator === "neq") return value !== expected;
  if (filter.operator === "contains") return String(value ?? "").includes(String(expected ?? ""));
  if (filter.operator === "startsWith") return String(value ?? "").startsWith(String(expected ?? ""));
  if (filter.operator === "endsWith") return String(value ?? "").endsWith(String(expected ?? ""));
  if (filter.operator === "gt") return compareValues(value, expected) > 0;
  if (filter.operator === "gte") return compareValues(value, expected) >= 0;
  if (filter.operator === "lt") return compareValues(value, expected) < 0;
  if (filter.operator === "lte") return compareValues(value, expected) <= 0;
  return false;
}

function compareValues(left: unknown, right: unknown): number {
  if (typeof left === "number" && typeof right === "number") return left - right;
  return String(left ?? "").localeCompare(String(right ?? ""));
}

function clampLimit(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return 50;
  return Math.min(100, Math.max(1, Math.floor(value)));
}

function workflowQueryFailure(
  nodeId: string,
  code: "WORKFLOW_NODE_FAILED" | "WORKFLOW_SCHEMA_NOT_FOUND",
  message: string,
): WorkflowNodeExecutionResult<QueryEntriesOutput> {
  return {
    error: {
      code,
      message: message || (code === "WORKFLOW_SCHEMA_NOT_FOUND" ? "Schema was not found." : "Workflow query node failed."),
      nodeId,
    },
    nodeId,
    ok: false,
    shouldStop: true,
  };
}

export function isWorkflowTemplateError(error: unknown): error is WorkflowTemplateError {
  return error instanceof WorkflowTemplateError;
}
