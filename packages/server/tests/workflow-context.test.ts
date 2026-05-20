import { describe, expect, it } from "vitest";
import {
  createWorkflowExecutionContext,
  sanitizeWorkflowHeaders,
  setWorkflowResponse,
  setWorkflowStepOutput,
  setWorkflowVariable,
} from "../src/index.js";

describe("workflow execution context", () => {
  it("creates request, vars, steps, and response containers", () => {
    const context = createWorkflowExecutionContext({
      body: { email: "user@example.com" },
      headers: {
        Authorization: "Bearer secret",
        "X-Request-Id": "req_123",
      },
      params: { orderId: "ord_1" },
      query: { limit: 10 },
    });

    expect(context.body).toEqual({ email: "user@example.com" });
    expect(context.params).toEqual({ orderId: "ord_1" });
    expect(context.query).toEqual({ limit: 10 });
    expect(context.headers).toEqual({ "x-request-id": "req_123" });
    expect(context.vars).toEqual({});
    expect(context.steps).toEqual({});
    expect(context.response).toEqual({ headers: {} });
  });

  it("excludes sensitive auth headers unless explicitly allowed", () => {
    const headers = {
      Authorization: "Bearer token",
      Cookie: "session=hidden",
      "X-Apiagex-Api-Token": "api_secret",
      "X-Apiagex-Role-Id": "role_reader",
      "X-Trace": ["a", "b"],
    };

    expect(sanitizeWorkflowHeaders(headers)).toEqual({ "x-trace": "a, b" });
    expect(sanitizeWorkflowHeaders(headers, true)).toEqual({
      authorization: "Bearer token",
      cookie: "session=hidden",
      "x-apiagex-api-token": "api_secret",
      "x-apiagex-role-id": "role_reader",
      "x-trace": "a, b",
    });
  });

  it("sets step outputs, variables, and response drafts", () => {
    const context = createWorkflowExecutionContext();

    setWorkflowStepOutput(context, "find-user", { entry: { id: "user_1" } });
    setWorkflowVariable(context, "total", 1);
    setWorkflowResponse(context, {
      body: { ok: true },
      headers: { "cache-control": "no-store" },
      status: 201,
    });

    expect(context.steps["find-user"]).toEqual({ entry: { id: "user_1" } });
    expect(context.vars.total).toBe(1);
    expect(context.response).toEqual({
      body: { ok: true },
      headers: { "cache-control": "no-store" },
      status: 201,
    });
  });
});
