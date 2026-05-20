import { describe, expect, it } from "vitest";
import {
  createWorkflowExecutionContext,
  executeWorkflowReturnResponseNode,
  setWorkflowStepOutput,
  type WorkflowNodeDefinition,
} from "../src/index.js";

function returnNode(config: WorkflowNodeDefinition<"returnResponse">["config"]): WorkflowNodeDefinition<"returnResponse"> {
  return {
    config,
    id: "return-created",
    type: "returnResponse",
  };
}

describe("workflow return response node", () => {
  it("sets response status, headers, and template-shaped body", () => {
    const context = createWorkflowExecutionContext({
      body: { email: "user@example.com" },
      headers: { "X-Request-Id": "req_123" },
    });
    setWorkflowStepOutput(context, "create-user", { entry: { id: "user_1" } });

    const result = executeWorkflowReturnResponseNode(context, returnNode({
      body: {
        email: "{{body.email}}",
        id: "{{steps.create-user.entry.id}}",
        ok: true,
      },
      headers: {
        "X-Request-Id": "{{headers.x-request-id}}",
      },
      status: 201,
    }));

    expect(result).toEqual({
      ok: true,
      output: {
        body: { email: "user@example.com", id: "user_1", ok: true },
        status: 201,
      },
      shouldStop: false,
    });
    expect(context.response).toEqual({
      body: { email: "user@example.com", id: "user_1", ok: true },
      headers: { "x-request-id": "req_123" },
      status: 201,
    });
  });

  it("fails predictably for bad templates or invalid status", () => {
    const badTemplate = executeWorkflowReturnResponseNode(createWorkflowExecutionContext(), returnNode({
      body: "{{body.email}}",
      status: 200,
    }));
    expect(badTemplate.ok).toBe(false);
    if (!badTemplate.ok) expect(badTemplate.error.code).toBe("WORKFLOW_NODE_FAILED");

    const badStatus = executeWorkflowReturnResponseNode(createWorkflowExecutionContext(), returnNode({
      body: { ok: true },
      status: 99,
    }));
    expect(badStatus.ok).toBe(false);
    if (!badStatus.ok) expect(badStatus.error.message).toContain("100-599");
  });
});
