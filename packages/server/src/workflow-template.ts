import type { WorkflowExecutionContext } from "./workflow-context.js";
import type { WorkflowJsonValue } from "./workflow.type.js";

export type WorkflowTemplateResolution = {
  path: string;
  value: WorkflowJsonValue;
};

export class WorkflowTemplateError extends Error {
  constructor(
    message: string,
    readonly path: string,
  ) {
    super(message);
    this.name = "WorkflowTemplateError";
  }
}

const templatePattern = /\{\{\s*([^{}]+?)\s*\}\}/g;
const unsafePathSegments = new Set(["__proto__", "constructor", "prototype"]);

export function resolveWorkflowTemplateValue(
  value: WorkflowJsonValue,
  context: WorkflowExecutionContext,
): WorkflowJsonValue {
  if (typeof value === "string") return resolveWorkflowTemplateString(value, context);
  if (Array.isArray(value)) return value.map((item) => resolveWorkflowTemplateValue(item, context));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, resolveWorkflowTemplateValue(item, context)]),
    );
  }
  return value;
}

export function resolveWorkflowTemplateString(
  value: string,
  context: WorkflowExecutionContext,
): WorkflowJsonValue {
  const wholeTemplate = value.match(/^\{\{\s*([^{}]+?)\s*\}\}$/);
  if (wholeTemplate?.[1]) return resolveWorkflowPath(wholeTemplate[1], context);
  return value.replace(templatePattern, (_match, rawPath: string) => {
    const resolved = resolveWorkflowPath(rawPath, context);
    return stringifyInterpolatedValue(resolved);
  });
}

export function resolveWorkflowPath(
  rawPath: string,
  context: WorkflowExecutionContext,
): WorkflowJsonValue {
  const path = rawPath.trim();
  if (!path) throw new WorkflowTemplateError("Workflow template path is empty.", rawPath);
  const segments = path.split(".");
  const root = segments.shift();
  let current: unknown = rootValue(root, context, path);
  for (const segment of segments) {
    if (!segment || unsafePathSegments.has(segment)) {
      throw new WorkflowTemplateError(`Workflow template path '${path}' is not allowed.`, path);
    }
    current = readSegment(current, segment, path);
  }
  return toWorkflowJsonValue(current, path);
}

function rootValue(
  root: string | undefined,
  context: WorkflowExecutionContext,
  path: string,
): unknown {
  if (root === "body") return context.body;
  if (root === "headers") return context.headers;
  if (root === "params") return context.params;
  if (root === "query") return context.query;
  if (root === "steps") return context.steps;
  if (root === "vars") return context.vars;
  throw new WorkflowTemplateError(`Workflow template root '${root ?? ""}' is not supported.`, path);
}

function readSegment(current: unknown, segment: string, path: string): unknown {
  if (Array.isArray(current)) {
    const index = Number(segment);
    if (!Number.isInteger(index) || index < 0 || index >= current.length) {
      throw new WorkflowTemplateError(`Workflow template path '${path}' was not found.`, path);
    }
    return current[index];
  }
  if (!current || typeof current !== "object" || !(segment in current)) {
    throw new WorkflowTemplateError(`Workflow template path '${path}' was not found.`, path);
  }
  return (current as Record<string, unknown>)[segment];
}

function toWorkflowJsonValue(value: unknown, path: string): WorkflowJsonValue {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (Array.isArray(value)) return value.map((item) => toWorkflowJsonValue(item, path));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, toWorkflowJsonValue(item, path)]),
    );
  }
  throw new WorkflowTemplateError(`Workflow template path '${path}' did not resolve to JSON.`, path);
}

function stringifyInterpolatedValue(value: WorkflowJsonValue): string {
  if (value === null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}
