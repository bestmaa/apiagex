import { randomUUID } from "node:crypto";
import type { ApiagexDatabase } from "./database-adapter.type.js";
import type {
  CreateWorkflowInput,
  UpdateWorkflowInput,
  WorkflowAuditActor,
  WorkflowDefinitionJson,
  WorkflowRecord,
} from "./workflow-repository.type.js";
import { assertValidWorkflowDraft } from "./workflow-validation.js";

type WorkflowRow = {
  active: number;
  createdAt: string;
  createdByEmail: string | null;
  createdById: string | null;
  description: string;
  definitionJson: string;
  id: string;
  lastRunAt: string | null;
  method: string;
  name: string;
  path: string;
  updatedAt: string;
  updatedByEmail: string | null;
  updatedById: string | null;
  version: number;
};

export async function createWorkflow(
  db: ApiagexDatabase,
  input: CreateWorkflowInput,
): Promise<WorkflowRecord> {
  const draft = normalizeWorkflowInput(input);
  assertValidWorkflowDraft(draft);
  await assertWorkflowRouteUnique(db, draft.method, draft.path);
  const id = randomUUID();
  const now = new Date().toISOString();
  const createdBy = normalizeActor(input.createdBy);
  await db.prepare(
    "INSERT INTO workflows (id, name, description, method, path, active, definition_json, created_at, updated_at, created_by_id, created_by_email, updated_by_id, updated_by_email, last_run_at, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  ).run(
    id,
    draft.name,
    draft.description ?? "",
    draft.method,
    draft.path,
    draft.active ? 1 : 0,
    JSON.stringify(draft.definition),
    now,
    now,
    createdBy?.id ?? null,
    createdBy?.email ?? null,
    createdBy?.id ?? null,
    createdBy?.email ?? null,
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
    description: input.description ?? existing.description,
    method: input.method ?? existing.method,
    name: input.name ?? existing.name,
    path: input.path ?? existing.path,
    version: input.version ?? existing.version,
  });
  assertValidWorkflowDraft(next);
  await assertWorkflowRouteUnique(db, next.method, next.path, id);
  const updatedBy = normalizeActor(input.updatedBy) ?? existing.updatedBy;
  await db.prepare(
    "UPDATE workflows SET name = ?, description = ?, method = ?, path = ?, active = ?, definition_json = ?, updated_at = ?, updated_by_id = ?, updated_by_email = ?, version = ? WHERE id = ?",
  ).run(
    next.name,
    next.description ?? "",
    next.method,
    next.path,
    next.active ? 1 : 0,
    JSON.stringify(next.definition),
    new Date().toISOString(),
    updatedBy?.id ?? null,
    updatedBy?.email ?? null,
    next.version,
    id,
  );
  return requireWorkflow(db, id);
}

export async function activateWorkflow(
  db: ApiagexDatabase,
  id: string,
  actor?: WorkflowAuditActor,
): Promise<WorkflowRecord> {
  return setWorkflowActive(db, id, true, actor);
}

export async function deactivateWorkflow(
  db: ApiagexDatabase,
  id: string,
  actor?: WorkflowAuditActor,
): Promise<WorkflowRecord> {
  return setWorkflowActive(db, id, false, actor);
}

export async function setWorkflowActive(
  db: ApiagexDatabase,
  id: string,
  active: boolean,
  actor?: WorkflowAuditActor,
): Promise<WorkflowRecord> {
  if (!(await getWorkflowById(db, id))) throw new Error("WORKFLOW_NOT_FOUND");
  const updatedBy = normalizeActor(actor);
  await db.prepare("UPDATE workflows SET active = ?, updated_at = ?, updated_by_id = COALESCE(?, updated_by_id), updated_by_email = COALESCE(?, updated_by_email) WHERE id = ?")
    .run(active ? 1 : 0, new Date().toISOString(), updatedBy?.id ?? null, updatedBy?.email ?? null, id);
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
    description: input.description?.trim() ?? "",
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
    createdBy: rowToActor(row.createdById, row.createdByEmail),
    definition: parseWorkflowDefinition(row.definitionJson),
    description: row.description,
    id: row.id,
    lastRunAt: row.lastRunAt,
    method: row.method,
    name: row.name,
    path: row.path,
    updatedAt: row.updatedAt,
    updatedBy: rowToActor(row.updatedById, row.updatedByEmail),
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
  return `SELECT id, name, description, method, path, active, definition_json as definitionJson, created_at as createdAt, updated_at as updatedAt, created_by_id as createdById, created_by_email as createdByEmail, updated_by_id as updatedById, updated_by_email as updatedByEmail, last_run_at as lastRunAt, version FROM workflows ${suffix}`;
}

function normalizeActor(actor: WorkflowAuditActor | undefined): WorkflowAuditActor | undefined {
  if (!actor) return undefined;
  const id = actor.id.trim();
  const email = actor.email.trim();
  if (!id || !email) throw new Error("WORKFLOW_AUDIT_ACTOR_INVALID");
  return { email, id };
}

function rowToActor(id: string | null, email: string | null): WorkflowAuditActor | null {
  return id && email ? { email, id } : null;
}
