import { describe, expect, it } from "vitest";
import {
  createWorkflowExecutionContext,
  resolveWorkflowPath,
  resolveWorkflowTemplateString,
  resolveWorkflowTemplateValue,
  setWorkflowStepOutput,
  setWorkflowVariable,
  WorkflowTemplateError,
} from "../src/index.js";

function templateContext() {
  const context = createWorkflowExecutionContext({
    body: {
      email: "user@example.com",
      items: [{ id: "item_1" }],
      profile: { name: "Aditya" },
    },
    headers: { "X-Request-Id": "req_123" },
    params: { orderId: "ord_1" },
    query: { search: "phone" },
  });
  setWorkflowStepOutput(context, "findUser", {
    entries: [{ id: "user_1", score: 10 }],
  });
  setWorkflowVariable(context, "total", 1);
  return context;
}

describe("workflow template resolver", () => {
  it("resolves whole-value templates to the original JSON value", () => {
    const context = templateContext();

    expect(resolveWorkflowTemplateString("{{body.profile}}", context)).toEqual({ name: "Aditya" });
    expect(resolveWorkflowTemplateString("{{steps.findUser.entries.0.score}}", context)).toBe(10);
    expect(resolveWorkflowTemplateString("{{vars.total}}", context)).toBe(1);
  });

  it("interpolates template strings without evaluating JavaScript", () => {
    const context = templateContext();

    expect(resolveWorkflowTemplateString("Order {{params.orderId}} for {{body.email}}", context))
      .toBe("Order ord_1 for user@example.com");
    expect(resolveWorkflowTemplateString("User {{steps.findUser.entries.0.id}}", context))
      .toBe("User user_1");
    expect(() => resolveWorkflowTemplateString("{{body.email.toUpperCase()}}", context))
      .toThrow(WorkflowTemplateError);
  });

  it("resolves templates recursively inside arrays and objects", () => {
    const context = templateContext();

    expect(resolveWorkflowTemplateValue({
      customerEmail: "{{body.email}}",
      lineItems: ["{{body.items.0.id}}"],
      message: "Search {{query.search}}",
      requestId: "{{headers.x-request-id}}",
    }, context)).toEqual({
      customerEmail: "user@example.com",
      lineItems: ["item_1"],
      message: "Search phone",
      requestId: "req_123",
    });
  });

  it("throws clear errors for missing, unsupported, or unsafe paths", () => {
    const context = templateContext();

    expect(() => resolveWorkflowPath("body.missing", context)).toThrow(WorkflowTemplateError);
    expect(() => resolveWorkflowPath("env.SECRET", context)).toThrow("not supported");
    expect(() => resolveWorkflowPath("body.__proto__.polluted", context)).toThrow("not allowed");
  });
});
