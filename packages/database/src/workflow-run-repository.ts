import { randomUUID } from "node:crypto";
import type { ApiagexDatabase } from "./database-adapter.type.js";
import type {
  RecordWorkflowRunInput,
  WorkflowRunRequestInput,
  WorkflowRunRecord,
  WorkflowRunRequestMetadata,
  WorkflowRunStatus,
} from "./workflow-run-repository.type.js";

const redactedValue = "[redacted]";
const sensitiveHeaderNames = new Set([
  "authorization",
  "cookie",
  "proxy-authorization",
  "set-cookie",
  "x-apiagex-admin-token",
  "x-apiagex-api-token",
]);

type WorkflowRunRow = {
  createdAt: string;
  durationMs: number;
  errorCode: string | null;
  id: string;
  requestJson: string;
  status: string;
  statusCode: number | null;
  workflowId: string;
};

export async function recordWorkflowRun(
  db: ApiagexDatabase,
  input: RecordWorkflowRunInput,
): Promise<WorkflowRunRecord> {
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const request = sanitizeWorkflowRunRequest(input.request);
  await db.prepare(
    "INSERT INTO workflow_runs (id, workflow_id, status, status_code, duration_ms, error_code, request_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  ).run(
    id,
    input.workflowId,
    input.status,
    input.statusCode ?? null,
    Math.max(0, Math.round(input.durationMs)),
    input.errorCode ?? null,
    JSON.stringify(request),
    createdAt,
  );
  await db.prepare("UPDATE workflows SET last_run_at = ? WHERE id = ?").run(createdAt, input.workflowId);
  return requireWorkflowRun(db, id);
}

export async function listWorkflowRuns(
  db: ApiagexDatabase,
  workflowId: string,
  limit = 50,
): Promise<WorkflowRunRecord[]> {
  const safeLimit = Math.max(1, Math.min(200, Math.round(limit)));
  const rows = await db.prepare(workflowRunSelectSql("WHERE workflow_id = ? ORDER BY created_at DESC LIMIT ?"))
    .all<WorkflowRunRow>(workflowId, safeLimit);
  return rows.map(rowToWorkflowRun);
}

export function sanitizeWorkflowRunRequest(
  input: WorkflowRunRequestInput,
): WorkflowRunRequestMetadata {
  return {
    headers: sanitizeHeaders(asRecord(input.headers)),
    method: typeof input.method === "string" ? input.method : "",
    params: asRecord(input.params),
    path: typeof input.path === "string" ? input.path : "",
    query: asRecord(input.query),
  };
}

async function requireWorkflowRun(db: ApiagexDatabase, id: string): Promise<WorkflowRunRecord> {
  const row = await db.prepare(workflowRunSelectSql("WHERE id = ?")).get<WorkflowRunRow>(id);
  if (!row) throw new Error("WORKFLOW_RUN_NOT_FOUND");
  return rowToWorkflowRun(row);
}

function rowToWorkflowRun(row: WorkflowRunRow): WorkflowRunRecord {
  return {
    createdAt: row.createdAt,
    durationMs: Number(row.durationMs),
    errorCode: row.errorCode,
    id: row.id,
    request: parseRequest(row.requestJson),
    status: parseStatus(row.status),
    statusCode: row.statusCode,
    workflowId: row.workflowId,
  };
}

function parseRequest(requestJson: string): WorkflowRunRequestMetadata {
  const parsed = JSON.parse(requestJson) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { headers: {}, method: "", params: {}, path: "", query: {} };
  }
  return sanitizeWorkflowRunRequest(parsed as WorkflowRunRequestInput);
}

function parseStatus(status: string): WorkflowRunStatus {
  return status === "success" ? "success" : "error";
}

function sanitizeHeaders(headers: Record<string, unknown>): Record<string, string> {
  const safeHeaders: Record<string, string> = {};
  for (const [name, value] of Object.entries(headers)) {
    const key = name.toLowerCase();
    safeHeaders[key] = sensitiveHeaderNames.has(key) || /token|secret|password|otp|key/i.test(key)
      ? redactedValue
      : String(value);
  }
  return safeHeaders;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return { ...(value as Record<string, unknown>) };
}

function workflowRunSelectSql(suffix: string): string {
  return `SELECT id, workflow_id as workflowId, status, status_code as statusCode, duration_ms as durationMs, error_code as errorCode, request_json as requestJson, created_at as createdAt FROM workflow_runs ${suffix}`;
}
