import type { FastifyInstance, FastifyReply } from "fastify";
import {
  createWebhook,
  deleteWebhook,
  listWebhookDeliveries,
  listWebhooks,
  updateWebhook,
  type SqliteDatabase,
} from "@apiagex/database";
import { dispatchPendingWebhooks } from "./webhook-dispatcher.js";
import type { WebhookDispatcherOptions } from "./webhook-dispatcher.type.js";
import type { WebhookBody, WebhookParams } from "./webhook-routes.type.js";

export function registerWebhookRoutes(
  server: FastifyInstance,
  database: SqliteDatabase,
  dispatcherOptions: WebhookDispatcherOptions = {},
): void {
  server.get("/api/admin/webhooks", async () => ({
    ok: true,
    webhooks: listWebhooks(database),
  }));

  server.post<{ Body: WebhookBody }>("/api/admin/webhooks", async (request, reply) => {
    try {
      return { ok: true, webhook: createWebhook(database, request.body) };
    } catch (error) {
      return sendWebhookError(reply, error, statusFor(error));
    }
  });

  server.put<{ Body: WebhookBody; Params: WebhookParams }>(
    "/api/admin/webhooks/:webhookId",
    async (request, reply) => {
      try {
        return { ok: true, webhook: updateWebhook(database, request.params.webhookId, request.body) };
      } catch (error) {
        return sendWebhookError(reply, error, statusFor(error));
      }
    },
  );

  server.delete<{ Params: WebhookParams }>("/api/admin/webhooks/:webhookId", async (request, reply) => {
    if (!deleteWebhook(database, request.params.webhookId)) {
      return reply.code(404).send({ ok: false, error: "WEBHOOK_NOT_FOUND" });
    }
    return { ok: true, deleted: true };
  });

  server.get<{ Params: WebhookParams }>(
    "/api/admin/webhooks/:webhookId/deliveries",
    async (request) => ({
      ok: true,
      deliveries: listWebhookDeliveries(database, request.params.webhookId),
    }),
  );

  server.post("/api/admin/webhooks/dispatch", async () => ({
    ok: true,
    results: await dispatchPendingWebhooks(database, dispatcherOptions),
  }));
}

function sendWebhookError(reply: FastifyReply, error: unknown, statusCode: number): FastifyReply {
  return reply.code(statusCode).send({ ok: false, error: errorCode(error) });
}

function statusFor(error: unknown): number {
  return errorCode(error).endsWith("_NOT_FOUND") ? 404 : 400;
}

function errorCode(error: unknown): string {
  return error instanceof Error ? error.message : "WEBHOOK_REQUEST_FAILED";
}
