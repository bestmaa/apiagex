import { describe, expect, it } from "vitest";
import {
  createWorkflowExecutionContext,
  evaluateBranchCondition,
  executeWorkflowBranchNode,
  setWorkflowStepOutput,
  type WorkflowNodeDefinition,
} from "../src/index.js";

function branchNode(config: WorkflowNodeDefinition<"branch">["config"]): WorkflowNodeDefinition<"branch"> {
  return {
    config,
    id: "check-user",
    type: "branch",
  };
}

describe("workflow branch node", () => {
  it("selects then node when condition matches", () => {
    const context = createWorkflowExecutionContext({ body: { status: "active" } });
    const node = branchNode({
      condition: {
        left: "{{body.status}}",
        operator: "eq",
        right: "active",
      },
      elseNodeId: "return-error",
      thenNodeId: "create-order",
    });

    const result = executeWorkflowBranchNode(context, node);

    expect(result).toEqual({
      ok: true,
      output: { matched: true, nextNodeId: "create-order" },
      shouldStop: false,
    });
    expect(context.steps["check-user"]).toEqual({ matched: true, nextNodeId: "create-order" });
  });

  it("selects else node when condition does not match", () => {
    const context = createWorkflowExecutionContext({ body: { total: 3 } });
    const result = executeWorkflowBranchNode(context, branchNode({
      condition: {
        left: "{{body.total}}",
        operator: "gt",
        right: 10,
      },
      elseNodeId: "return-too-small",
      thenNodeId: "approve",
    }));

    expect(result).toMatchObject({
      ok: true,
      output: { matched: false, nextNodeId: "return-too-small" },
    });
  });

  it("supports existence, empty, contains, and comparison helpers", () => {
    expect(evaluateBranchCondition("value", "exists")).toBe(true);
    expect(evaluateBranchCondition("", "empty")).toBe(true);
    expect(evaluateBranchCondition([], "notEmpty")).toBe(false);
    expect(evaluateBranchCondition("phone case", "contains", "phone")).toBe(true);
    expect(evaluateBranchCondition(5, "gte", 5)).toBe(true);
    expect(evaluateBranchCondition({ id: "1" }, "eq", { id: "1" })).toBe(true);
  });

  it("uses safe step-output expressions and fails on bad templates", () => {
    const context = createWorkflowExecutionContext();
    setWorkflowStepOutput(context, "findUser", { entries: [{ id: "user_1" }] });

    const matched = executeWorkflowBranchNode(context, branchNode({
      condition: {
        left: "{{steps.findUser.entries.0.id}}",
        operator: "exists",
      },
      elseNodeId: "create-user",
      thenNodeId: "return-existing",
    }));

    expect(matched).toMatchObject({
      ok: true,
      output: { matched: true, nextNodeId: "return-existing" },
    });

    const failed = executeWorkflowBranchNode(createWorkflowExecutionContext(), branchNode({
      condition: {
        left: "{{body.missing}}",
        operator: "exists",
      },
      elseNodeId: "create-user",
      thenNodeId: "return-existing",
    }));

    expect(failed.ok).toBe(false);
    if (!failed.ok) expect(failed.error.code).toBe("WORKFLOW_NODE_FAILED");
  });
});
