import {
  createWorkflow,
  deleteWorkflow,
  getWorkflowById,
  listWorkflowRuns,
  listWorkflows,
  syncWorkflowCustomApiRoutes,
  updateWorkflow,
  type ApiagexDatabase,
  type WorkflowAuditActor,
} from "@apiagex/database";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ownerTokenFromRequest, verifyOwnerToken } from "./admin-auth.js";
import { createWorkflowExecutionContext } from "./workflow-context.js";
import { executeWorkflowDefinition } from "./workflow-executor.js";
import type { CreateWorkflowBody, TestWorkflowBody, UpdateWorkflowBody, WorkflowParams } from "./workflow-admin-routes.type.js";
import type { WorkflowDefinition, WorkflowJsonValue } from "./workflow.type.js";

export function registerWorkflowAdminRoutes(server: FastifyInstance, database: ApiagexDatabase): void {
  server.get("/api/admin/workflows", async () => ({
    ok: true,
    workflows: await listWorkflows(database),
  }));

  server.post<{ Body: CreateWorkflowBody }>("/api/admin/workflows", async (request, reply) => {
    try {
      const workflow = await createWorkflow(database, {
        ...request.body,
        createdBy: await workflowActor(database, request),
      });
      await syncWorkflowCustomApiRoutes(database);
      return reply.code(201).send({ ok: true, workflow });
    } catch (error) {
      return sendWorkflowAdminError(reply, error);
    }
  });

  server.get<{ Params: WorkflowParams }>("/api/admin/workflows/:workflowId", async (request, reply) => {
    const workflow = await getWorkflowById(database, request.params.workflowId);
    if (!workflow) return reply.code(404).send({ ok: false, error: "WORKFLOW_NOT_FOUND" });
    return { ok: true, workflow };
  });

  server.get<{ Params: WorkflowParams; Querystring: { limit?: string } }>(
    "/api/admin/workflows/:workflowId/runs",
    async (request, reply) => {
      const workflow = await getWorkflowById(database, request.params.workflowId);
      if (!workflow) return reply.code(404).send({ ok: false, error: "WORKFLOW_NOT_FOUND" });
      return {
        ok: true,
        runs: await listWorkflowRuns(database, workflow.id, Number(request.query.limit ?? 50)),
      };
    },
  );

  server.post<{ Body: TestWorkflowBody; Params: WorkflowParams }>(
    "/api/admin/workflows/:workflowId/test-run",
    async (request, reply) => {
      const workflow = await getWorkflowById(database, request.params.workflowId);
      if (!workflow) return reply.code(404).send({ ok: false, error: "WORKFLOW_NOT_FOUND" });
      const context = createWorkflowExecutionContext({
        body: jsonValueOrNull(request.body?.body),
        headers: stringRecord(request.body?.headers),
        params: stringRecord(request.body?.params),
        query: jsonRecord(request.body?.query),
      });
      const result = await executeWorkflowDefinition(
        database,
        context,
        workflow.definition as unknown as WorkflowDefinition,
      );
      return reply.send({
        ok: true,
        result: {
          error: result.ok ? null : result.error,
          executedNodeIds: result.executedNodeIds,
          ok: result.ok,
          response: result.ok ? result.response : result.context.response,
          steps: result.context.steps,
        },
        workflow: {
          active: workflow.active,
          id: workflow.id,
          method: workflow.method,
          path: workflow.path,
        },
      });
    },
  );

  server.put<{ Body: UpdateWorkflowBody; Params: WorkflowParams }>(
    "/api/admin/workflows/:workflowId",
    async (request, reply) => {
      try {
        const workflow = await updateWorkflow(database, request.params.workflowId, {
          ...request.body,
          updatedBy: await workflowActor(database, request),
        });
        await syncWorkflowCustomApiRoutes(database);
        return { ok: true, workflow };
      } catch (error) {
        return sendWorkflowAdminError(reply, error);
      }
    },
  );

  server.delete<{ Params: WorkflowParams }>("/api/admin/workflows/:workflowId", async (request, reply) => {
    if (!(await deleteWorkflow(database, request.params.workflowId))) {
      return reply.code(404).send({ ok: false, error: "WORKFLOW_NOT_FOUND" });
    }
    await syncWorkflowCustomApiRoutes(database);
    return { ok: true, deleted: true };
  });
}

async function workflowActor(
  database: ApiagexDatabase,
  request: FastifyRequest,
): Promise<WorkflowAuditActor> {
  const result = await verifyOwnerToken(database, ownerTokenFromRequest(request));
  if (result.ok) return { email: result.user.email, id: result.user.id };
  return { email: "admin", id: "admin" };
}

function sendWorkflowAdminError(reply: FastifyReply, error: unknown): FastifyReply {
  const message = error instanceof Error ? error.message : "WORKFLOW_REQUEST_FAILED";
  const statusCode = message.includes("NOT_FOUND") ? 404 : 400;
  return reply.code(statusCode).send({ ok: false, error: message });
}

function jsonValueOrNull(value: unknown): WorkflowJsonValue {
  return isJsonValue(value) ? value : null;
}

function jsonRecord(value: unknown): Record<string, WorkflowJsonValue> {
  if (!isRecord(value)) return {};
  const next: Record<string, WorkflowJsonValue> = {};
  for (const [key, item] of Object.entries(value)) {
    if (isJsonValue(item)) next[key] = item;
  }
  return next;
}

function stringRecord(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {};
  const next: Record<string, string> = {};
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === "string") next[key] = item;
    else if (typeof item === "number" || typeof item === "boolean") next[key] = String(item);
  }
  return next;
}

function isJsonValue(value: unknown): value is WorkflowJsonValue {
  if (value === null) return true;
  const type = typeof value;
  if (type === "string" || type === "number" || type === "boolean") return true;
  if (Array.isArray(value)) return value.every(isJsonValue);
  if (!isRecord(value)) return false;
  return Object.values(value).every(isJsonValue);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
