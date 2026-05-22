import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  createSchema,
  createWorkflow,
  getWorkflowById,
  getWorkflowByMethodPath,
  listCustomApiRoutes,
  listSchemas,
  listWorkflows,
  recordCustomApiPermissionEvent,
  setCustomApiPermission,
  syncWorkflowCustomApiRoutes,
  type ApiagexDatabase,
  type AutomationTokenRecord,
  type AutomationTokenScope,
  type WorkflowRecord,
} from "@apiagex/database";
import { requireAutomationToken } from "./automation-auth.js";
import { createWorkflowExecutionContext } from "./workflow-context.js";
import { executeWorkflowDefinition } from "./workflow-executor.js";
import type {
  ApiagexMcpCreateSchemaInput,
  ApiagexMcpCreateWorkflowApiInput,
  ApiagexMcpSetPermissionInput,
  ApiagexMcpTestWorkflowInput,
} from "./mcp-tool-contract.type.js";
import type { WorkflowDefinition, WorkflowJsonValue } from "./workflow.type.js";

export function registerAiAutomationRoutes(server: FastifyInstance, database: ApiagexDatabase): void {
  server.get("/api/ai/schemas", async (request, reply) => {
    if (!(await automationGuard(database, request, reply, ["schemas:manage"]))) return;
    return {
      ok: true,
      schemas: (await listSchemas(database)).map((schema) => ({
        fieldCount: schema.fields.length,
        id: schema.id,
        name: schema.name,
        slug: schema.slug,
      })),
    };
  });

  server.post<{ Body: ApiagexMcpCreateSchemaInput }>("/api/ai/schemas", async (request, reply) => {
    if (!(await automationGuard(database, request, reply, ["schemas:manage"]))) return;
    try {
      const schema = await createSchema(database, {
        name: request.body.name,
        slug: request.body.slug,
        fields: request.body.fields.map((field) => ({
          name: field.name,
          slug: field.slug,
          type: field.type,
          ...(field.required === undefined ? {} : { required: field.required }),
          ...(field.relationSchemaId === undefined ? {} : { relationSchemaId: field.relationSchemaId }),
          ...(field.relationType === undefined ? {} : { relationType: field.relationType }),
        })),
        ...(request.body.description === undefined ? {} : { description: request.body.description }),
      });
      return {
        ok: true,
        schema: {
          fieldCount: schema.fields.length,
          id: schema.id,
          name: schema.name,
          slug: schema.slug,
        },
      };
    } catch (error) {
      return sendAiError(reply, error);
    }
  });

  server.post<{ Body: ApiagexMcpCreateWorkflowApiInput }>("/api/ai/workflows", async (request, reply) => {
    const token = await automationGuard(database, request, reply, ["workflows:manage"]);
    if (!token) return;
    try {
      const workflow = await createWorkflow(database, {
        definition: request.body.definition,
        method: request.body.method,
        name: request.body.name,
        path: request.body.path,
        createdBy: automationActor(token),
        ...(request.body.active === undefined ? {} : { active: request.body.active }),
        ...(request.body.description === undefined ? {} : { description: request.body.description }),
        version: request.body.definition.version,
      });
      await syncWorkflowCustomApiRoutes(database);
      return { ok: true, workflow: workflowSummary(workflow) };
    } catch (error) {
      return sendAiError(reply, error);
    }
  });

  server.post<{ Body: ApiagexMcpTestWorkflowInput }>("/api/ai/workflows/test", async (request, reply) => {
    if (!(await automationGuard(database, request, reply, ["workflows:manage"]))) return;
    const workflow = await resolveWorkflowForTest(database, request.body);
    if (!workflow) return reply.code(404).send({ ok: false, error: "WORKFLOW_NOT_FOUND" });
    const context = createWorkflowExecutionContext({
      body: jsonValueOrNull(request.body.body),
      headers: stringRecord(request.body.headers),
      params: {},
      query: {},
    });
    const result = await executeWorkflowDefinition(database, context, workflow.definition as unknown as WorkflowDefinition);
    const response = result.ok ? result.response : result.context.response;
    return {
      body: response.body,
      ok: result.ok,
      statusCode: response.status ?? 200,
    };
  });

  server.get("/api/ai/routes", async (request, reply) => {
    if (!(await automationGuard(database, request, reply, ["routes:read"]))) return;
    await syncWorkflowCustomApiRoutes(database);
    return {
      ok: true,
      routes: (await listCustomApiRoutes(database)).map((route) => ({
        active: route.active,
        id: route.id,
        method: route.method,
        path: route.path,
        permissionKey: route.permissionKey,
      })),
    };
  });

  server.post<{ Body: ApiagexMcpSetPermissionInput }>("/api/ai/permissions", async (request, reply) => {
    const token = await automationGuard(database, request, reply, ["permissions:manage"]);
    if (!token) return;
    const route = (await listCustomApiRoutes(database)).find((item) => item.permissionKey === request.body.permissionKey);
    if (!route) return reply.code(404).send({ ok: false, error: "CUSTOM_API_ROUTE_NOT_FOUND" });
    try {
      const permission = await setCustomApiPermission(database, {
        allowed: request.body.allowed,
        customApiRouteId: route.id,
        roleId: request.body.roleId,
      });
      await recordCustomApiPermissionEvent(database, {
        actorEmail: token.createdByEmail ?? "automation@apiagex.local",
        actorId: token.createdById ?? token.id,
        allowed: request.body.allowed,
        customApiRouteId: route.id,
        roleId: request.body.roleId,
      });
      return {
        allowed: permission.allowed,
        ok: true,
        permissionKey: route.permissionKey,
        roleId: permission.roleId,
      };
    } catch (error) {
      return sendAiError(reply, error);
    }
  });

  server.get("/api/ai/summary", async (request, reply) => {
    if (!(await automationGuard(database, request, reply, ["routes:read"]))) return;
    await syncWorkflowCustomApiRoutes(database);
    const schemas = await listSchemas(database);
    const workflows = await listWorkflows(database);
    const routes = await listCustomApiRoutes(database);
    return {
      ok: true,
      markdown: [
        "# Apiagex Summary",
        "",
        `Schemas: ${schemas.length}`,
        ...schemas.map((schema) => `- ${schema.slug}: ${schema.fields.length} fields`),
        "",
        `Workflow APIs: ${workflows.length}`,
        ...workflows.map((workflow) => `- ${workflow.method} ${workflow.path}: ${workflow.active ? "active" : "inactive"}`),
        "",
        `Custom routes: ${routes.length}`,
        ...routes.map((route) => `- ${route.method} ${route.path}: ${route.permissionKey}`),
        "",
      ].join("\n"),
    };
  });
}

async function automationGuard(
  database: ApiagexDatabase,
  request: FastifyRequest,
  reply: FastifyReply,
  scopes: AutomationTokenScope[],
): Promise<AutomationTokenRecord | undefined> {
  return requireAutomationToken(database, request, reply, scopes);
}

async function resolveWorkflowForTest(
  database: ApiagexDatabase,
  input: ApiagexMcpTestWorkflowInput,
): Promise<WorkflowRecord | undefined> {
  if (input.workflowId) return getWorkflowById(database, input.workflowId);
  if (input.method && input.path) return getWorkflowByMethodPath(database, input.method, input.path);
  return undefined;
}

function workflowSummary(workflow: WorkflowRecord) {
  return {
    active: workflow.active,
    id: workflow.id,
    method: workflow.method,
    name: workflow.name,
    path: workflow.path,
  };
}

function automationActor(token: AutomationTokenRecord): { email: string; id: string } {
  return {
    email: token.createdByEmail ?? "automation@apiagex.local",
    id: token.createdById ?? token.id,
  };
}

function sendAiError(reply: FastifyReply, error: unknown): FastifyReply {
  const message = error instanceof Error ? error.message : "AI_AUTOMATION_REQUEST_FAILED";
  const statusCode = message.includes("NOT_FOUND") ? 404 : 400;
  return reply.code(statusCode).send({ ok: false, error: message });
}

function jsonValueOrNull(value: unknown): WorkflowJsonValue {
  return isJsonValue(value) ? value : null;
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
