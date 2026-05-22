import {
  APIAGEX_MCP_TOOL_NAMES,
  type ApiagexMcpToolName,
} from "./mcp-tool-contract.type.js";

export type ApiagexMcpRunnerOptions = {
  baseUrl: string;
  automationToken?: string | undefined;
  fetchImpl?: typeof fetch | undefined;
};

export type ApiagexMcpToolResult = {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
};

type JsonRpcRequest = {
  id?: string | number | null;
  jsonrpc?: string;
  method?: string;
  params?: unknown;
};

type ToolCallParams = {
  name?: string;
  arguments?: unknown;
};

export function createApiagexMcpToolRunner(options: ApiagexMcpRunnerOptions) {
  const baseUrl = options.baseUrl.replace(/\/+$/, "");
  const fetchImpl = options.fetchImpl ?? fetch;

  return async function runTool(name: ApiagexMcpToolName, input: unknown = {}): Promise<ApiagexMcpToolResult> {
    try {
      const output = await callApiagexTool(fetchImpl, baseUrl, options.automationToken, name, input);
      return { content: [{ type: "text", text: JSON.stringify(output, null, 2) }] };
    } catch (error) {
      return {
        content: [{ type: "text", text: sanitizeMcpError(error) }],
        isError: true,
      };
    }
  };
}

export async function handleApiagexMcpJsonRpcMessage(
  message: JsonRpcRequest,
  options: ApiagexMcpRunnerOptions,
): Promise<Record<string, unknown> | undefined> {
  if (message.method === "notifications/initialized") return undefined;
  if (message.method === "initialize") {
    return {
      id: message.id ?? null,
      jsonrpc: "2.0",
      result: {
        capabilities: { tools: {} },
        protocolVersion: "2024-11-05",
        serverInfo: { name: "apiagex-mcp", version: "0.8.20" },
      },
    };
  }
  if (message.method === "tools/list") {
    return {
      id: message.id ?? null,
      jsonrpc: "2.0",
      result: { tools: APIAGEX_MCP_TOOL_NAMES.map(toolDescription) },
    };
  }
  if (message.method === "tools/call") {
    const params = isRecord(message.params) ? message.params as ToolCallParams : {};
    if (!isToolName(params.name)) return jsonRpcError(message.id, "Unknown Apiagex MCP tool.");
    const runTool = createApiagexMcpToolRunner(options);
    return {
      id: message.id ?? null,
      jsonrpc: "2.0",
      result: await runTool(params.name, params.arguments ?? {}),
    };
  }
  return jsonRpcError(message.id, `Unsupported MCP method: ${message.method ?? "unknown"}`);
}

export async function runApiagexMcpStdioServer(options: ApiagexMcpRunnerOptions): Promise<void> {
  let buffer = "";
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) {
    buffer += chunk;
    let newline = buffer.indexOf("\n");
    while (newline !== -1) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (line) {
        const response = await handleApiagexMcpJsonRpcMessage(JSON.parse(line) as JsonRpcRequest, options);
        if (response) process.stdout.write(`${JSON.stringify(response)}\n`);
      }
      newline = buffer.indexOf("\n");
    }
  }
}

async function callApiagexTool(
  fetchImpl: typeof fetch,
  baseUrl: string,
  automationToken: string | undefined,
  name: ApiagexMcpToolName,
  input: unknown,
): Promise<unknown> {
  if (name === "apiagex.health") return requestJson(fetchImpl, baseUrl, undefined, "GET", "/api/health");
  if (!automationToken) throw new Error("APIAGEX_AUTOMATION_TOKEN is required for this MCP tool.");
  const token = automationToken;
  if (name === "apiagex.list_schemas") return requestJson(fetchImpl, baseUrl, token, "GET", "/api/ai/schemas");
  if (name === "apiagex.create_schema") return requestJson(fetchImpl, baseUrl, token, "POST", "/api/ai/schemas", input);
  if (name === "apiagex.create_workflow_api") return requestJson(fetchImpl, baseUrl, token, "POST", "/api/ai/workflows", input);
  if (name === "apiagex.test_workflow") return requestJson(fetchImpl, baseUrl, token, "POST", "/api/ai/workflows/test", input);
  if (name === "apiagex.list_routes") return requestJson(fetchImpl, baseUrl, token, "GET", "/api/ai/routes");
  if (name === "apiagex.set_permission") return requestJson(fetchImpl, baseUrl, token, "POST", "/api/ai/permissions", input);
  return requestJson(fetchImpl, baseUrl, token, "GET", "/api/ai/summary");
}

async function requestJson(
  fetchImpl: typeof fetch,
  baseUrl: string,
  automationToken: string | undefined,
  method: string,
  path: string,
  body?: unknown,
): Promise<unknown> {
  const init: RequestInit = {
    headers: {
      ...(automationToken ? { "x-apiagex-automation-token": automationToken } : {}),
      ...(body === undefined ? {} : { "content-type": "application/json" }),
    },
    method,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  };
  const response = await fetchImpl(`${baseUrl}${path}`, init);
  const parsed: unknown = await response.json().catch(async () => ({ error: await response.text() }));
  if (!response.ok) throw new Error(`Apiagex request failed (${response.status}): ${JSON.stringify(parsed)}`);
  return parsed;
}

function toolDescription(name: ApiagexMcpToolName): Record<string, unknown> {
  return {
    description: toolDescriptionText(name),
    inputSchema: { additionalProperties: true, type: "object" },
    name,
  };
}

function toolDescriptionText(name: ApiagexMcpToolName): string {
  const descriptions: Record<ApiagexMcpToolName, string> = {
    "apiagex.create_schema": "Create one missing Apiagex schema.",
    "apiagex.create_workflow_api": "Create a workflow-backed custom API.",
    "apiagex.export_summary": "Export a concise Apiagex summary.",
    "apiagex.health": "Check Apiagex health.",
    "apiagex.list_routes": "List custom API routes.",
    "apiagex.list_schemas": "List Apiagex schemas.",
    "apiagex.set_permission": "Set a custom API permission.",
    "apiagex.test_workflow": "Test a workflow API.",
  };
  return descriptions[name];
}

function jsonRpcError(id: string | number | null | undefined, message: string): Record<string, unknown> {
  return {
    error: { code: -32601, message },
    id: id ?? null,
    jsonrpc: "2.0",
  };
}

function isToolName(value: unknown): value is ApiagexMcpToolName {
  return typeof value === "string" && (APIAGEX_MCP_TOOL_NAMES as readonly string[]).includes(value);
}

function sanitizeMcpError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/agx_auto_[A-Za-z0-9_-]+/g, "agx_auto_[redacted]");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
