import type { WorkflowJsonValue } from "./workflow.type.js";

export type WorkflowRuntimeLimits = {
  maxNodeExecutions: number;
  maxQueryLimit: number;
  maxResponseBytes: number;
  timeoutMs: number;
};

export type WorkflowRuntimeLimitOptions = Partial<WorkflowRuntimeLimits>;

export const defaultWorkflowRuntimeLimits: WorkflowRuntimeLimits = {
  maxNodeExecutions: 100,
  maxQueryLimit: 100,
  maxResponseBytes: 256 * 1024,
  timeoutMs: 5_000,
};

export function resolveWorkflowRuntimeLimits(options: WorkflowRuntimeLimitOptions = {}): WorkflowRuntimeLimits {
  return {
    maxNodeExecutions: positiveInteger(options.maxNodeExecutions, defaultWorkflowRuntimeLimits.maxNodeExecutions),
    maxQueryLimit: positiveInteger(options.maxQueryLimit, defaultWorkflowRuntimeLimits.maxQueryLimit),
    maxResponseBytes: positiveInteger(options.maxResponseBytes, defaultWorkflowRuntimeLimits.maxResponseBytes),
    timeoutMs: nonNegativeInteger(options.timeoutMs, defaultWorkflowRuntimeLimits.timeoutMs),
  };
}

export function workflowTimedOut(startedAtMs: number, timeoutMs: number, nowMs = Date.now()): boolean {
  return nowMs - startedAtMs >= timeoutMs;
}

export function workflowResponseBytes(value: WorkflowJsonValue | undefined): number {
  return Buffer.byteLength(JSON.stringify(value ?? null), "utf8");
}

function positiveInteger(value: number | undefined, fallback: number): number {
  if (value === undefined || !Number.isFinite(value)) return fallback;
  return Math.max(1, Math.floor(value));
}

function nonNegativeInteger(value: number | undefined, fallback: number): number {
  if (value === undefined || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.floor(value));
}
