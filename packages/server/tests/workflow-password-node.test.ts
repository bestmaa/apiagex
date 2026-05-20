import { openMigratedSqliteAdapter } from "@apiagex/database";
import { describe, expect, it } from "vitest";
import {
  createWorkflowExecutionContext,
  executeWorkflowDefinition,
  executeWorkflowHashPasswordNode,
  executeWorkflowVerifyPasswordNode,
  type WorkflowDefinition,
  type WorkflowNodeDefinition,
} from "../src/index.js";

function hashNode(
  config: WorkflowNodeDefinition<"hashPassword">["config"],
): WorkflowNodeDefinition<"hashPassword"> {
  return {
    config,
    id: "hash-password",
    type: "hashPassword",
  };
}

function verifyNode(
  config: WorkflowNodeDefinition<"verifyPassword">["config"],
): WorkflowNodeDefinition<"verifyPassword"> {
  return {
    config,
    id: "verify-password",
    type: "verifyPassword",
  };
}

describe("workflow password nodes", () => {
  it("hashes passwords without returning the plain password", async () => {
    const context = createWorkflowExecutionContext({ body: { password: "Password123!" } });

    const first = await executeWorkflowHashPasswordNode(context, hashNode({
      outputKey: "passwordHash",
      password: "{{body.password}}",
    }));
    const second = await executeWorkflowHashPasswordNode(createWorkflowExecutionContext({ body: { password: "Password123!" } }), hashNode({
      password: "{{body.password}}",
    }));

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(first.output.algorithm).toBe("scrypt");
      expect(first.output.hash).toContain("scrypt$");
      expect(first.output.hash).not.toContain("Password123!");
      expect(second.output.hash).not.toBe(first.output.hash);
      expect(context.vars.passwordHash).toBe(first.output.hash);
    }
  });

  it("verifies matching and non-matching passwords", async () => {
    const hashResult = await executeWorkflowHashPasswordNode(createWorkflowExecutionContext({ body: { password: "Password123!" } }), hashNode({
      password: "{{body.password}}",
    }));
    expect(hashResult.ok).toBe(true);
    if (!hashResult.ok) throw new Error("HASH_FAILED");

    const matched = await executeWorkflowVerifyPasswordNode(createWorkflowExecutionContext({
      body: { password: "Password123!" },
    }), verifyNode({
      hash: hashResult.output.hash,
      outputKey: "passwordMatched",
      password: "{{body.password}}",
    }));
    const wrong = await executeWorkflowVerifyPasswordNode(createWorkflowExecutionContext({ body: { password: "WrongPassword123!" } }), verifyNode({
      hash: hashResult.output.hash,
      password: "{{body.password}}",
    }));

    expect(matched.ok).toBe(true);
    if (matched.ok) {
      expect(matched.output).toEqual({ matched: true, needsRehash: false });
    }
    expect(wrong.ok).toBe(true);
    if (wrong.ok) {
      expect(wrong.output).toEqual({ matched: false, needsRehash: false });
    }
  });

  it("rejects short passwords and malformed hashes with controlled errors", async () => {
    const short = await executeWorkflowHashPasswordNode(createWorkflowExecutionContext({ body: { password: "short" } }), hashNode({
      password: "{{body.password}}",
    }));
    expect(short.ok).toBe(false);
    if (!short.ok) expect(short.error.code).toBe("PASSWORD_INPUT_TOO_SHORT");

    const malformed = await executeWorkflowVerifyPasswordNode(createWorkflowExecutionContext({ body: { password: "Password123!" } }), verifyNode({
      hash: "not-a-supported-hash",
      password: "{{body.password}}",
    }));
    expect(malformed.ok).toBe(false);
    if (!malformed.ok) expect(malformed.error.code).toBe("PASSWORD_VERIFY_INVALID_HASH");
  });

  it("runs hash and verify nodes inside a workflow definition", async () => {
    const db = openMigratedSqliteAdapter();
    const context = createWorkflowExecutionContext({ body: { password: "Password123!" } });
    const definition: WorkflowDefinition = {
      edges: [
        { from: "start", id: "edge-start-hash", to: "hash-password" },
        { from: "hash-password", id: "edge-hash-verify", to: "verify-password" },
        { from: "verify-password", id: "edge-verify-return", to: "return-ok" },
      ],
      nodes: [
        { config: {}, id: "start", type: "routeTrigger" },
        {
          config: {
            outputKey: "passwordHash",
            password: "{{body.password}}",
          },
          id: "hash-password",
          type: "hashPassword",
        },
        {
          config: {
            hash: "{{vars.passwordHash}}",
            password: "{{body.password}}",
          },
          id: "verify-password",
          type: "verifyPassword",
        },
        {
          config: {
            body: { matched: "{{steps.verify-password.matched}}" },
            status: 200,
          },
          id: "return-ok",
          type: "returnResponse",
        },
      ],
      route: { method: "POST", path: "/auth/check" },
      startNodeId: "start",
      version: 1,
    };

    const result = await executeWorkflowDefinition(db, context, definition);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.response.body).toEqual({ matched: true });
  });
});
