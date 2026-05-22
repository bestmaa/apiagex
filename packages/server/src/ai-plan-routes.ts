import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  createEntry,
  createSchema,
  createWorkflow,
  getSchemaBySlug,
  getWorkflowByMethodPath,
  listCustomApiRoutes,
  recordCustomApiPermissionEvent,
  setCustomApiPermission,
  syncWorkflowCustomApiRoutes,
  type ApiagexDatabase,
  type AutomationTokenRecord,
  type EntryData,
} from "@apiagex/database";
import { requireAutomationToken } from "./automation-auth.js";
import {
  APIAGEX_AI_PLAN_VERSION,
  type ApiagexAiPlan,
  type ApiagexAiPlanApplyResult,
  type ApiagexAiPlanOperation,
  type ApiagexAiPlanPreview,
} from "./ai-plan.type.js";

export function registerAiPlanRoutes(server: FastifyInstance, database: ApiagexDatabase): void {
  server.post<{ Body: ApiagexAiPlan }>("/api/ai/plans/preview", async (request, reply) => {
    if (!(await requirePlanToken(database, request, reply))) return;
    try {
      return await previewAiPlan(database, request.body);
    } catch (error) {
      return sendPlanError(reply, error);
    }
  });

  server.post<{ Body: ApiagexAiPlan }>("/api/ai/plans/apply", async (request, reply) => {
    const token = await requirePlanToken(database, request, reply);
    if (!token) return;
    try {
      return await applyAiPlan(database, request.body, token);
    } catch (error) {
      return sendPlanError(reply, error);
    }
  });
}

export async function previewAiPlan(database: ApiagexDatabase, plan: ApiagexAiPlan): Promise<ApiagexAiPlanPreview> {
  validatePlan(plan);
  const warnings: string[] = [];
  for (const operation of plan.operations) {
    if (operation.kind === "createSchema" && await getSchemaBySlug(database, operation.schema.slug)) {
      warnings.push(`Schema ${operation.schema.slug} already exists and will be skipped.`);
    }
    if (operation.kind === "createWorkflowApi" && await getWorkflowByMethodPath(database, operation.workflow.method, operation.workflow.path)) {
      warnings.push(`Workflow ${operation.workflow.method} ${operation.workflow.path} already exists and will be skipped.`);
    }
  }
  return {
    ok: true,
    operations: plan.operations.map((operation) => ({
      id: operation.id,
      kind: operation.kind,
      summary: operationSummary(operation),
    })),
    plan,
    warnings,
  };
}

export async function applyAiPlan(
  database: ApiagexDatabase,
  plan: ApiagexAiPlan,
  token: AutomationTokenRecord,
): Promise<ApiagexAiPlanApplyResult> {
  await previewAiPlan(database, plan);
  const appliedOperationIds: string[] = [];
  const skippedOperationIds: string[] = [];
  for (const operation of plan.operations) {
    if (operation.kind === "createSchema") {
      if (await getSchemaBySlug(database, operation.schema.slug)) {
        skippedOperationIds.push(operation.id);
        continue;
      }
      await createSchema(database, {
        fields: operation.schema.fields.map((field) => ({
          name: field.name,
          slug: field.slug,
          type: field.type,
          ...(field.required === undefined ? {} : { required: field.required }),
          ...(field.relationSchemaId === undefined ? {} : { relationSchemaId: field.relationSchemaId }),
          ...(field.relationType === undefined ? {} : { relationType: field.relationType }),
        })),
        name: operation.schema.name,
        slug: operation.schema.slug,
        ...(operation.schema.description === undefined ? {} : { description: operation.schema.description }),
      });
      appliedOperationIds.push(operation.id);
    } else if (operation.kind === "createWorkflowApi") {
      if (await getWorkflowByMethodPath(database, operation.workflow.method, operation.workflow.path)) {
        skippedOperationIds.push(operation.id);
        continue;
      }
      await createWorkflow(database, {
        definition: operation.workflow.definition,
        method: operation.workflow.method,
        name: operation.workflow.name,
        path: operation.workflow.path,
        createdBy: automationActor(token),
        ...(operation.workflow.active === undefined ? {} : { active: operation.workflow.active }),
        ...(operation.workflow.description === undefined ? {} : { description: operation.workflow.description }),
        version: operation.workflow.definition.version,
      });
      await syncWorkflowCustomApiRoutes(database);
      appliedOperationIds.push(operation.id);
    } else if (operation.kind === "setPermission") {
      await syncWorkflowCustomApiRoutes(database);
      const route = (await listCustomApiRoutes(database))
        .find((item) => item.permissionKey === operation.permission.permissionKey);
      if (!route) {
        skippedOperationIds.push(operation.id);
        continue;
      }
      await setCustomApiPermission(database, {
        allowed: operation.permission.allowed,
        customApiRouteId: route.id,
        roleId: operation.permission.roleId,
      });
      await recordCustomApiPermissionEvent(database, {
        actorEmail: token.createdByEmail ?? "automation@apiagex.local",
        actorId: token.createdById ?? token.id,
        allowed: operation.permission.allowed,
        customApiRouteId: route.id,
        roleId: operation.permission.roleId,
      });
      appliedOperationIds.push(operation.id);
    } else {
      let seedSkipped = false;
      for (const entry of operation.seed.entries) {
        const schema = await getSchemaBySlug(database, entry.schemaSlug);
        if (!schema) {
          seedSkipped = true;
          continue;
        }
        await createEntry(database, { data: entry.data as EntryData, schemaId: schema.id });
      }
      if (seedSkipped) skippedOperationIds.push(operation.id);
      else appliedOperationIds.push(operation.id);
    }
  }
  return {
    appliedOperationIds,
    ok: true,
    skippedOperationIds,
    summary: `Applied ${appliedOperationIds.length} operation(s), skipped ${skippedOperationIds.length}.`,
  };
}

async function requirePlanToken(
  database: ApiagexDatabase,
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<AutomationTokenRecord | undefined> {
  return requireAutomationToken(database, request, reply, ["plans:apply"]);
}

function validatePlan(plan: ApiagexAiPlan): void {
  if (!plan || typeof plan !== "object") throw new Error("AI_PLAN_INVALID");
  if (plan.version !== APIAGEX_AI_PLAN_VERSION) throw new Error("AI_PLAN_VERSION_UNSUPPORTED");
  if (!plan.title.trim()) throw new Error("AI_PLAN_TITLE_REQUIRED");
  if (!plan.summary.trim()) throw new Error("AI_PLAN_SUMMARY_REQUIRED");
  if (!Array.isArray(plan.operations) || plan.operations.length === 0) throw new Error("AI_PLAN_OPERATIONS_REQUIRED");
  assertNoSecrets(plan);
}

function assertNoSecrets(value: unknown, keyPath = ""): void {
  if (typeof value === "string") {
    if (/agx_auto_[A-Za-z0-9_-]+/.test(value)) throw new Error("AI_PLAN_SECRET_VALUE_FORBIDDEN");
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoSecrets(item, `${keyPath}.${index}`));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, item] of Object.entries(value)) {
    const nextPath = keyPath ? `${keyPath}.${key}` : key;
    if (/(authorization|cookie|password|secret|token)$/i.test(key)) throw new Error(`AI_PLAN_SECRET_FIELD_FORBIDDEN:${nextPath}`);
    assertNoSecrets(item, nextPath);
  }
}

function operationSummary(operation: ApiagexAiPlanOperation): string {
  if (operation.kind === "createSchema") return `Create schema ${operation.schema.slug}`;
  if (operation.kind === "createWorkflowApi") return `Create workflow ${operation.workflow.method} ${operation.workflow.path}`;
  if (operation.kind === "setPermission") return `Set permission ${operation.permission.permissionKey}`;
  return `Seed ${operation.seed.entries.length} entries`;
}

function automationActor(token: AutomationTokenRecord): { email: string; id: string } {
  return {
    email: token.createdByEmail ?? "automation@apiagex.local",
    id: token.createdById ?? token.id,
  };
}

function sendPlanError(reply: FastifyReply, error: unknown): FastifyReply {
  const message = error instanceof Error ? error.message : "AI_PLAN_REQUEST_FAILED";
  const statusCode = message.includes("NOT_FOUND") ? 404 : 400;
  return reply.code(statusCode).send({ ok: false, error: message });
}
