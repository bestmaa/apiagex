import { randomUUID } from "node:crypto";
import type { ApiagexDatabase } from "./database-adapter.type.js";
import type {
  CreateWorkflowInput,
  UpdateWorkflowInput,
  WorkflowDefinitionJson,
  WorkflowRecord,
} from "./workflow-repository.type.js";

type WorkflowRow = Omit<WorkflowRecord, "active" | "definition"> & {
  active: number;
  definitionJson: string;
};

export async function createWorkflow(
  db: ApiagexDatabase,
  input: CreateWorkflowInput,
): Promise<WorkflowRecord> {
  const draft = normalizeWorkflowInput(input);
  await assertWorkflowRouteUnique(db, draft.method, draft.path);
  const id = randomUUID();
  const now = new Date().toISOString();
  await db.prepare(
    "INSERT INTO workflows (id, name, method, path, active, definition_json, created_at, updated_at, last_run_at, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  ).run(
    id,
    draft.name,
    draft.method,
    draft.path,
    draft.active ? 1 : 0,
    JSON.stringify(draft.definition),
    now,
    now,
    null,
    draft.version,
  );
  return requireWorkflow(db, id);
}

export async function listWorkflows(db: ApiagexDatabase): Promise<WorkflowRecord[]> {
  const rows = await db
    .prepare(workflowSelectSql("ORDER BY active DESC, name ASC, method ASC, path ASC"))
    .all<WorkflowRow>();
  return rows.map(rowToWorkflow);
}

export async function getWorkflowById(
  db: ApiagexDatabase,
  id: string,
): Promise<WorkflowRecord | undefined> {
  const row = await db.prepare(workflowSelectSql("WHERE id = ?")).get<WorkflowRow>(id);
  return row ? rowToWorkflow(row) : undefined;
}

export async function getWorkflowByMethodPath(
  db: ApiagexDatabase,
  method: string,
  path: string,
): Promise<WorkflowRecord | undefined> {
  const row = await db
    .prepare(workflowSelectSql("WHERE method = ? AND path = ?"))
    .get<WorkflowRow>(normalizeMethod(method), normalizePath(path));
  return row ? rowToWorkflow(row) : undefined;
}

export async function updateWorkflow(
  db: ApiagexDatabase,
  id: string,
  input: UpdateWorkflowInput,
): Promise<WorkflowRecord> {
  const existing = await getWorkflowById(db, id);
  if (!existing) throw new Error("WORKFLOW_NOT_FOUND");
  const next = normalizeWorkflowInput({
    active: input.active ?? existing.active,
    definition: input.definition ?? existing.definition,
    method: input.method ?? existing.method,
    name: input.name ?? existing.name,
    path: input.path ?? existing.path,
    version: input.version ?? existing.version,
  });
  await assertWorkflowRouteUnique(db, next.method, next.path, id);
  await db.prepare(
    "UPDATE workflows SET name = ?, method = ?, path = ?, active = ?, definition_json = ?, updated_at = ?, version = ? WHERE id = ?",
  ).run(
    next.name,
    next.method,
    next.path,
    next.active ? 1 : 0,
    JSON.stringify(next.definition),
    new Date().toISOString(),
    next.version,
    id,
  );
  return requireWorkflow(db, id);
}

export async function activateWorkflow(db: ApiagexDatabase, id: string): Promise<WorkflowRecord> {
  return setWorkflowActive(db, id, true);
}

export async function deactivateWorkflow(db: ApiagexDatabase, id: string): Promise<WorkflowRecord> {
  return setWorkflowActive(db, id, false);
}

export async function setWorkflowActive(
  db: ApiagexDatabase,
  id: string,
  active: boolean,
): Promise<WorkflowRecord> {
  if (!(await getWorkflowById(db, id))) throw new Error("WORKFLOW_NOT_FOUND");
  await db.prepare("UPDATE workflows SET active = ?, updated_at = ? WHERE id = ?")
    .run(active ? 1 : 0, new Date().toISOString(), id);
  return requireWorkflow(db, id);
}

export async function deleteWorkflow(db: ApiagexDatabase, id: string): Promise<boolean> {
  const result = await db.prepare("DELETE FROM workflows WHERE id = ?").run(id);
  return result.changes > 0;
}

async function assertWorkflowRouteUnique(
  db: ApiagexDatabase,
  method: string,
  path: string,
  ignoreId?: string,
): Promise<void> {
  const existing = await getWorkflowByMethodPath(db, method, path);
  if (existing && existing.id !== ignoreId) throw new Error("WORKFLOW_ROUTE_CONFLICT");
}

async function requireWorkflow(db: ApiagexDatabase, id: string): Promise<WorkflowRecord> {
  const workflow = await getWorkflowById(db, id);
  if (!workflow) throw new Error("WORKFLOW_NOT_FOUND");
  return workflow;
}

function normalizeWorkflowInput(input: CreateWorkflowInput & { active: boolean }): CreateWorkflowInput & { active: boolean };
function normalizeWorkflowInput(input: CreateWorkflowInput): CreateWorkflowInput & { active: boolean };
function normalizeWorkflowInput(input: CreateWorkflowInput): CreateWorkflowInput & { active: boolean } {
  const name = input.name.trim();
  const path = normalizePath(input.path);
  if (!name) throw new Error("WORKFLOW_NAME_REQUIRED");
  if (!path) throw new Error("WORKFLOW_PATH_REQUIRED");
  return {
    active: input.active ?? false,
    definition: input.definition,
    method: normalizeMethod(input.method),
    name,
    path,
    version: input.version,
  };
}

function normalizeMethod(method: string): string {
  const normalized = method.trim().toUpperCase();
  if (!normalized) throw new Error("WORKFLOW_METHOD_REQUIRED");
  return normalized;
}

function normalizePath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function rowToWorkflow(row: WorkflowRow): WorkflowRecord {
  return {
    active: Boolean(row.active),
    createdAt: row.createdAt,
    definition: parseWorkflowDefinition(row.definitionJson),
    id: row.id,
    lastRunAt: row.lastRunAt,
    method: row.method,
    name: row.name,
    path: row.path,
    updatedAt: row.updatedAt,
    version: row.version,
  };
}

function parseWorkflowDefinition(definitionJson: string): WorkflowDefinitionJson {
  const parsed = JSON.parse(definitionJson) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("WORKFLOW_DEFINITION_INVALID");
  }
  return parsed as WorkflowDefinitionJson;
}

function workflowSelectSql(suffix: string): string {
  return `SELECT id, name, method, path, active, definition_json as definitionJson, created_at as createdAt, updated_at as updatedAt, last_run_at as lastRunAt, version FROM workflows ${suffix}`;
}
