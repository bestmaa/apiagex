import {
  getWorkflowByMethodPath,
  recordWorkflowRun,
  syncWorkflowCustomApiRoutes,
  type ApiagexDatabase,
} from "@apiagex/database";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { authorizeCustomApi } from "./custom-api-routes.js";
import { createWorkflowExecutionContext } from "./workflow-context.js";
import { executeWorkflowDefinition } from "./workflow-executor.js";
import type { WorkflowDefinition, WorkflowJsonValue } from "./workflow.type.js";

const customApiPrefix = "/api/custom";

export function registerWorkflowRoutes(server: FastifyInstance, database: ApiagexDatabase): void {
  server.register(async (workflowServer) => {
    await syncWorkflowCustomApiRoutes(database);
    workflowServer.all("/", (request, reply) => handleWorkflowRequest(database, request, reply));
    workflowServer.all("/*", (request, reply) => handleWorkflowRequest(database, request, reply));
  }, { prefix: customApiPrefix });
}

async function handleWorkflowRequest(
  database: ApiagexDatabase,
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply | void> {
  const method = request.method === "HEAD" ? "GET" : request.method.toUpperCase();
  const workflow = await getWorkflowByMethodPath(database, method, requestWorkflowPath(request));
  if (!workflow?.active) return reply.code(404).send({ ok: false, error: "WORKFLOW_NOT_FOUND" });
  await authorizeCustomApi(database, request, reply);
  if (reply.sent) return;

  const startedAt = Date.now();
  const context = createWorkflowExecutionContext({
    body: (request.body ?? null) as WorkflowJsonValue,
    headers: request.headers,
    params: request.params as Record<string, string>,
    query: request.query as Record<string, WorkflowJsonValue>,
  });
  const result = await executeWorkflowDefinition(
    database,
    context,
    workflow.definition as unknown as WorkflowDefinition,
  );
  if (!result.ok) {
    const statusCode = workflowErrorStatus(result.error.code);
    await recordWorkflowRunSafely(database, {
      durationMs: Date.now() - startedAt,
      errorCode: result.error.code,
      request: {
        headers: request.headers,
        method: workflow.method,
        params: request.params as Record<string, unknown>,
        path: routePath(workflow.path),
        query: request.query as Record<string, unknown>,
      },
      status: "error",
      statusCode,
      workflowId: workflow.id,
    });
    return reply.code(statusCode).send({ ok: false, error: result.error });
  }
  const statusCode = result.response.status ?? 200;
  await recordWorkflowRunSafely(database, {
    durationMs: Date.now() - startedAt,
    request: {
      headers: request.headers,
      method: workflow.method,
      params: request.params as Record<string, unknown>,
      path: routePath(workflow.path),
      query: request.query as Record<string, unknown>,
    },
    status: "success",
    statusCode,
    workflowId: workflow.id,
  });
  return reply
    .code(statusCode)
    .headers(result.response.headers)
    .send(result.response.body ?? { ok: true });
}

async function recordWorkflowRunSafely(
  database: ApiagexDatabase,
  input: Parameters<typeof recordWorkflowRun>[1],
): Promise<void> {
  try {
    await recordWorkflowRun(database, input);
  } catch {
    // Workflow history must not change API responses.
  }
}

function routePath(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (cleanPath.startsWith(`${customApiPrefix}/`)) return cleanPath;
  return `${customApiPrefix}${cleanPath}`;
}

function requestWorkflowPath(request: FastifyRequest): string {
  const cleanPath = request.url.split("?")[0] ?? "/";
  if (cleanPath === customApiPrefix) return "/";
  if (cleanPath.startsWith(`${customApiPrefix}/`)) return cleanPath.slice(customApiPrefix.length);
  return cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
}

function workflowErrorStatus(code: string): number {
  if (code === "WORKFLOW_VALIDATION_FAILED") return 400;
  if (code === "WORKFLOW_FORBIDDEN") return 403;
  if (code === "WORKFLOW_ENTRY_NOT_FOUND" || code === "WORKFLOW_NOT_FOUND" || code === "WORKFLOW_SCHEMA_NOT_FOUND") return 404;
  if (code === "WORKFLOW_DEFINITION_INVALID") return 422;
  if (code === "WORKFLOW_LIMIT_EXCEEDED") return 422;
  if (code.startsWith("HTTP_")) return code === "HTTP_URL_NOT_ALLOWED" || code === "HTTP_TEMPLATE_VALUE_MISSING" ? 400 : 502;
  if (code.startsWith("PASSWORD_")) return 400;
  return 500;
}
