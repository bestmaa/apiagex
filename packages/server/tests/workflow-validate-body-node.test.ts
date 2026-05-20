import { describe, expect, it } from "vitest";
import {
  createWorkflowExecutionContext,
  executeWorkflowValidateBodyNode,
  type WorkflowNodeDefinition,
} from "../src/index.js";

function validateNode(overrides: Partial<WorkflowNodeDefinition<"validateBody">["config"]> = {}): WorkflowNodeDefinition<"validateBody"> {
  return {
    config: {
      fields: {
        email: { required: true, type: "email" },
        password: { minLength: 8, required: true, type: "string" },
        role: { enum: ["admin", "reader"], type: "string" },
      },
      ...overrides,
    },
    id: "validate-register-body",
    type: "validateBody",
  };
}

describe("workflow validate body node", () => {
  it("passes valid request body and stores step output", () => {
    const context = createWorkflowExecutionContext({
      body: {
        email: "user@example.com",
        password: "password123",
        role: "reader",
      },
    });

    const result = executeWorkflowValidateBodyNode(context, validateNode());

    expect(result).toEqual({ ok: true, output: { valid: true }, shouldStop: false });
    expect(context.steps["validate-register-body"]).toEqual({ valid: true });
  });

  it("stops workflow by default on required field failure", () => {
    const context = createWorkflowExecutionContext({
      body: {
        email: "user@example.com",
      },
    });

    const result = executeWorkflowValidateBodyNode(context, validateNode());

    expect(result.ok).toBe(false);
    expect(result.shouldStop).toBe(true);
    if (!result.ok) {
      expect(result.error.code).toBe("WORKFLOW_VALIDATION_FAILED");
      expect(result.error.details).toEqual({ field: "password" });
    }
    expect(context.steps["validate-register-body"]).toEqual({ valid: false });
  });

  it("supports email, length, enum, and continue-on-failure behavior", () => {
    const context = createWorkflowExecutionContext({
      body: {
        email: "bad-email",
        password: "short",
        role: "owner",
      },
    });

    const result = executeWorkflowValidateBodyNode(context, validateNode({ onFailure: "continue" }));

    expect(result.ok).toBe(false);
    expect(result.shouldStop).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("Field must be a valid email.");
    }
  });

  it("validates simple body field types", () => {
    const context = createWorkflowExecutionContext({
      body: {
        active: true,
        count: 2,
        meta: { source: "test" },
        tags: ["new"],
      },
    });
    const node = validateNode({
      fields: {
        active: { type: "boolean" },
        count: { type: "number" },
        meta: { type: "object" },
        tags: { type: "array" },
      },
    });

    expect(executeWorkflowValidateBodyNode(context, node)).toMatchObject({
      ok: true,
      output: { valid: true },
    });
  });
});
