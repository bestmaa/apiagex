import {
  createWorkflow,
  deleteWorkflow,
  getWorkflowById,
  listWorkflows,
  syncWorkflowCustomApiRoutes,
  updateWorkflow,
  type ApiagexDatabase,
  type WorkflowAuditActor,
} from "@apiagex/database";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ownerTokenFromRequest, verifyOwnerToken } from "./admin-auth.js";
import type { CreateWorkflowBody, UpdateWorkflowBody, WorkflowParams } from "./workflow-admin-routes.type.js";

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
