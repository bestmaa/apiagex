import { describe, expect, it, vi } from "vitest";
import {
  createWorkflowExecutionContext,
  executeWorkflowDefinition,
  executeWorkflowHttpRequestNode,
  type WorkflowDefinition,
  type WorkflowHttpRequestFetch,
  type WorkflowNodeDefinition,
} from "../src/index.js";
import { openMigratedSqliteAdapter } from "@apiagex/database";

function httpNode(
  config: WorkflowNodeDefinition<"httpRequest">["config"],
): WorkflowNodeDefinition<"httpRequest"> {
  return {
    config,
    id: "send-provider-call",
    type: "httpRequest",
  };
}

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}): Awaited<ReturnType<WorkflowHttpRequestFetch>> {
  return {
    headers: {
      entries: () => Object.entries(headers),
    },
    status,
    text: async () => JSON.stringify(body),
  };
}

describe("workflow HTTP request node", () => {
  it("calls an allowed provider with templates, secret references, and redacted output", async () => {
    process.env.APIAGEX_SECRET_PROVIDER_APIKEY = "provider-secret";
    const fetchMock = vi.fn<WorkflowHttpRequestFetch>(async (url, init) => {
      expect(url).toBe("https://api.provider.test/messages?version=v1");
      expect(init.method).toBe("POST");
      expect(init.headers.authorization).toBe("Bearer provider-secret");
      expect(JSON.parse(init.body ?? "{}")).toEqual({
        message: "Hello Aditya",
        to: "+15551230000",
      });
      return jsonResponse(202, {
        id: "msg_123",
        nested: { token: "provider-secret" },
        token: "provider-secret",
      }, { "content-type": "application/json", "x-provider-request-id": "req_123" });
    });
    const context = createWorkflowExecutionContext({
      body: { name: "Aditya", phone: "+15551230000" },
    });

    const result = await executeWorkflowHttpRequestNode(context, httpNode({
      body: {
        message: "Hello {{body.name}}",
        to: "{{body.phone}}",
      },
      headers: {
        authorization: "Bearer secret:provider.apiKey",
      },
      method: "POST",
      outputKey: "sms",
      query: { version: "v1" },
      successStatus: [202],
      timeoutMs: 1000,
      url: "https://api.provider.test/messages",
    }), {
      allowedHosts: ["api.provider.test"],
      fetch: fetchMock,
      resolveHostname: async () => ["203.0.113.10"],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output).toMatchObject({
        attempts: 1,
        body: {
          id: "msg_123",
          nested: { token: "[REDACTED]" },
          token: "[REDACTED]",
        },
        headers: {
          "content-type": "application/json",
          "x-provider-request-id": "req_123",
        },
        status: 202,
      });
    }
    expect(context.steps["send-provider-call"]).toMatchObject({
      body: { token: "[REDACTED]" },
      status: 202,
    });
    expect(context.vars.sms).toMatchObject({ token: "[REDACTED]" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    delete process.env.APIAGEX_SECRET_PROVIDER_APIKEY;
  });

  it("blocks hosts outside the allowlist", async () => {
    const result = await executeWorkflowHttpRequestNode(createWorkflowExecutionContext(), httpNode({
      method: "GET",
      url: "https://evil.example/data",
    }), {
      allowedHosts: ["api.provider.test"],
      fetch: vi.fn<WorkflowHttpRequestFetch>(),
      resolveHostname: async () => ["203.0.113.10"],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("HTTP_URL_NOT_ALLOWED");
  });

  it("blocks private network targets after resolution", async () => {
    const result = await executeWorkflowHttpRequestNode(createWorkflowExecutionContext(), httpNode({
      method: "GET",
      url: "https://api.provider.test/data",
    }), {
      allowedHosts: ["api.provider.test"],
      fetch: vi.fn<WorkflowHttpRequestFetch>(),
      resolveHostname: async () => ["127.0.0.1"],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("HTTP_PRIVATE_NETWORK_BLOCKED");
  });

  it("retries retryable provider status and records attempt count", async () => {
    const fetchMock = vi.fn<WorkflowHttpRequestFetch>()
      .mockResolvedValueOnce(jsonResponse(500, { ok: false }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));

    const result = await executeWorkflowHttpRequestNode(createWorkflowExecutionContext(), httpNode({
      method: "POST",
      responseBodyMode: "json",
      retry: { attempts: 1, backoffMs: 0 },
      url: "https://api.provider.test/retry",
    }), {
      allowedHosts: ["api.provider.test"],
      fetch: fetchMock,
      resolveHostname: async () => ["203.0.113.10"],
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.output.attempts).toBe(2);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("runs as part of a workflow definition", async () => {
    const db = openMigratedSqliteAdapter();
    const context = createWorkflowExecutionContext();
    const definition: WorkflowDefinition = {
      edges: [
        { from: "start", id: "edge-start-http", to: "call-provider" },
        { from: "call-provider", id: "edge-http-return", to: "return-ok" },
      ],
      nodes: [
        { config: {}, id: "start", type: "routeTrigger" },
        {
          config: {
            method: "GET",
            outputKey: "provider",
            url: "https://api.provider.test/status",
          },
          id: "call-provider",
          type: "httpRequest",
        },
        {
          config: {
            body: { provider: "{{vars.provider.ok}}" },
            status: 200,
          },
          id: "return-ok",
          type: "returnResponse",
        },
      ],
      route: { method: "GET", path: "/provider/status" },
      startNodeId: "start",
      version: 1,
    };

    const result = await executeWorkflowDefinition(db, context, definition, {
      httpRequest: {
        allowedHosts: ["api.provider.test"],
        fetch: async () => jsonResponse(200, { ok: true }),
        resolveHostname: async () => ["203.0.113.10"],
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.response.body).toEqual({ provider: true });
  });
});
