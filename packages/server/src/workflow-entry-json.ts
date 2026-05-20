import type { EntryRecord } from "@apiagex/database";
import type { WorkflowJsonValue } from "./workflow.type.js";

export function entryToWorkflowJson(entry: EntryRecord): WorkflowJsonValue {
  return {
    createdAt: entry.createdAt,
    data: toWorkflowJsonValue(entry.data),
    id: entry.id,
    schemaId: entry.schemaId,
    updatedAt: entry.updatedAt,
  };
}

export function toWorkflowJsonValue(value: unknown): WorkflowJsonValue {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (Array.isArray(value)) return value.map(toWorkflowJsonValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, toWorkflowJsonValue(item)]));
  }
  return null;
}
