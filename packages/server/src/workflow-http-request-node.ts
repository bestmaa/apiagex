import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { setWorkflowStepOutput, setWorkflowVariable } from "./workflow-context.js";
import type { WorkflowExecutionContext } from "./workflow-context.js";
import type { WorkflowNodeExecutionResult } from "./workflow-node-result.type.js";
import { resolveWorkflowTemplateValue } from "./workflow-template.js";
import type {
  WorkflowHttpMethod,
  WorkflowJsonValue,
  WorkflowNodeDefinition,
  WorkflowNodeOutputByType,
} from "./workflow.type.js";

type HttpRequestOutput = WorkflowNodeOutputByType["httpRequest"];

export type WorkflowHttpRequestFetch = (
  url: string,
  init: {
    body?: string | undefined;
    headers: Record<string, string>;
    method: WorkflowHttpMethod;
    redirect: "manual";
    signal: AbortSignal;
  },
) => Promise<WorkflowHttpResponse>;

export type WorkflowHttpResponse = {
  headers?: {
    entries?: () => IterableIterator<[string, string]> | Iterable<[string, string]>;
    forEach?: (callback: (value: string, key: string) => void) => void;
  };
  status: number;
  text: () => Promise<string>;
};

export type WorkflowHttpRequestOptions = {
  allowHttp?: boolean;
  allowedHosts?: string[];
  fetch?: WorkflowHttpRequestFetch;
  resolveHostname?: (hostname: string) => Promise<string[]>;
};

type ResolvedRequest = {
  body?: string | undefined;
  headers: Record<string, string>;
  redactionValues: string[];
  url: URL;
};

const defaultTimeoutMs = 5_000;
const maxTimeoutMs = 15_000;
const maxRetryAttempts = 2;
const maxRetryBackoffMs = 2_000;
const maxResponseBodyBytes = 16 * 1024;
const blockedHeaders = new Set([
  "connection",
  "host",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);
const sensitiveKeys = new Set([
  "apikey",
  "api_key",
  "authorization",
  "clientsecret",
  "client_secret",
  "cookie",
  "otp",
  "password",
  "refresh_token",
  "refreshtoken",
  "secret",
  "set-cookie",
  "token",
  "x-api-key",
  "x-auth-token",
]);

export async function executeWorkflowHttpRequestNode(
  context: WorkflowExecutionContext,
  node: WorkflowNodeDefinition<"httpRequest">,
  options: WorkflowHttpRequestOptions = {},
): Promise<WorkflowNodeExecutionResult<HttpRequestOutput>> {
  try {
    const request = await resolveHttpRequest(context, node, options);
    const timeoutMs = boundedInteger(node.config.timeoutMs, defaultTimeoutMs, 1_000, maxTimeoutMs);
    const retryAttempts = boundedInteger(node.config.retry?.attempts, 0, 0, maxRetryAttempts);
    const retryBackoffMs = boundedInteger(node.config.retry?.backoffMs, 0, 0, maxRetryBackoffMs);
    const fetcher = options.fetch ?? defaultFetch;
    const expectedStatus = new Set(node.config.successStatus?.length ? node.config.successStatus : successStatuses());
    let lastError: Error | undefined;

    for (let attemptIndex = 0; attemptIndex <= retryAttempts; attemptIndex += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetcher(request.url.toString(), {
          body: request.body,
          headers: request.headers,
          method: node.config.method,
          redirect: "manual",
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (isRedirectStatus(response.status)) {
          return httpFailure(node.id, "HTTP_REDIRECT_NOT_ALLOWED", "HTTP redirects are not allowed for workflow HTTP requests.");
        }
        if (!expectedStatus.has(response.status)) {
          if (attemptIndex < retryAttempts && shouldRetryStatus(response.status)) {
            await wait(retryBackoffMs);
            continue;
          }
          return httpFailure(node.id, "HTTP_STATUS_NOT_ALLOWED", `HTTP request returned status ${response.status}, which is not allowed.`);
        }
        const output = await responseOutput(response, node, attemptIndex + 1, request.redactionValues);
        setWorkflowStepOutput(context, node.id, output);
        if (node.config.outputKey?.trim()) setWorkflowVariable(context, node.config.outputKey.trim(), output.body);
        return { ok: true, output, shouldStop: false };
      } catch (error) {
        clearTimeout(timeout);
        if (isAbortError(error)) return httpFailure(node.id, "HTTP_REQUEST_TIMEOUT", `HTTP request timeout exceeded (${timeoutMs}ms).`);
        lastError = error instanceof Error ? error : new Error("HTTP request failed.");
        if (attemptIndex < retryAttempts) {
          await wait(retryBackoffMs);
          continue;
        }
      }
    }

    return httpFailure(node.id, "HTTP_REQUEST_FAILED", lastError?.message ?? "HTTP request failed.");
  } catch (error) {
    if (error instanceof WorkflowHttpRequestError) {
      return httpFailure(node.id, error.code, error.message);
    }
    const message = error instanceof Error ? error.message : "Workflow HTTP request node failed.";
    return httpFailure(node.id, "WORKFLOW_NODE_FAILED", message);
  }
}

async function resolveHttpRequest(
  context: WorkflowExecutionContext,
  node: WorkflowNodeDefinition<"httpRequest">,
  options: WorkflowHttpRequestOptions,
): Promise<ResolvedRequest> {
  const redactionValues: string[] = [];
  const url = resolveRequestUrl(context, node.config.url);
  const allowedHosts = options.allowedHosts ?? hostsFromEnv();
  if (!isAllowedHost(url.hostname, allowedHosts)) {
    throw new WorkflowHttpRequestError("HTTP_URL_NOT_ALLOWED", `HTTP host '${url.hostname}' is not in the workflow allowlist.`);
  }
  if (url.protocol !== "https:" && !(options.allowHttp === true && url.protocol === "http:")) {
    throw new WorkflowHttpRequestError("HTTP_URL_NOT_ALLOWED", "Workflow HTTP URL must use https.");
  }
  await assertPublicHost(url.hostname, options);
  for (const [key, value] of Object.entries(node.config.query ?? {})) {
    url.searchParams.set(key, stringFromJson(resolveWorkflowTemplateValue(value, context), `query.${key}`));
  }
  const headers = resolveHeaders(context, node.config.headers ?? {}, redactionValues);
  const body = resolveBody(context, node, headers, redactionValues);
  return { body, headers, redactionValues, url };
}

function resolveRequestUrl(context: WorkflowExecutionContext, rawUrl: string): URL {
  if (rawUrl.includes("{{body.url}}") || rawUrl.includes("{{body.host}}") || /^{{.*}}$/.test(rawUrl.trim())) {
    throw new WorkflowHttpRequestError("HTTP_URL_NOT_ALLOWED", "Workflow HTTP URL host cannot be controlled by request data.");
  }
  const resolved = resolveWorkflowTemplateValue(rawUrl, context);
  if (typeof resolved !== "string") {
    throw new WorkflowHttpRequestError("HTTP_TEMPLATE_VALUE_MISSING", "Workflow HTTP URL must resolve to a string.");
  }
  try {
    return new URL(resolved);
  } catch {
    throw new WorkflowHttpRequestError("HTTP_URL_NOT_ALLOWED", "Workflow HTTP URL is invalid.");
  }
}

function resolveHeaders(
  context: WorkflowExecutionContext,
  rawHeaders: Record<string, WorkflowJsonValue>,
  redactionValues: string[],
): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const [rawName, rawValue] of Object.entries(rawHeaders)) {
    const name = rawName.trim().toLowerCase();
    if (!name || blockedHeaders.has(name)) continue;
    const resolved = resolveSecretReferences(stringFromJson(resolveWorkflowTemplateValue(rawValue, context), `headers.${name}`), redactionValues);
    headers[name] = resolved;
  }
  return headers;
}

function resolveBody(
  context: WorkflowExecutionContext,
  node: WorkflowNodeDefinition<"httpRequest">,
  headers: Record<string, string>,
  redactionValues: string[],
): string | undefined {
  if (!Object.hasOwn(node.config, "body") || node.config.body === undefined) return undefined;
  const resolved = resolveWorkflowTemplateValue(node.config.body, context);
  const secretResolved = resolveSecretReferencesInJson(resolved, redactionValues);
  if (typeof secretResolved === "string") return secretResolved;
  if (!headers["content-type"]) headers["content-type"] = "application/json";
  return JSON.stringify(secretResolved);
}

async function responseOutput(
  response: WorkflowHttpResponse,
  node: WorkflowNodeDefinition<"httpRequest">,
  attempts: number,
  redactionValues: string[],
): Promise<HttpRequestOutput> {
  const headers = redactHeaders(safeResponseHeaders(response.headers), redactionValues);
  const mode = node.config.responseBodyMode ?? "json";
  if (mode === "none") return { attempts, body: null, headers, status: response.status };
  const text = await response.text();
  if (Buffer.byteLength(text, "utf8") > maxResponseBodyBytes) {
    throw new WorkflowHttpRequestError("HTTP_RESPONSE_TOO_LARGE", `HTTP response body exceeded ${maxResponseBodyBytes} bytes.`);
  }
  if (mode === "text") {
    return { attempts, body: redactString(text, redactionValues), headers, status: response.status };
  }
  try {
    return {
      attempts,
      body: redactJson(JSON.parse(text) as WorkflowJsonValue, redactionValues),
      headers,
      status: response.status,
    };
  } catch {
    throw new WorkflowHttpRequestError("HTTP_RESPONSE_JSON_INVALID", "HTTP response body was not valid JSON.");
  }
}

async function assertPublicHost(hostname: string, options: WorkflowHttpRequestOptions): Promise<void> {
  const addresses = await (options.resolveHostname ?? defaultResolveHostname)(hostname);
  if (addresses.some(isPrivateAddress)) {
    throw new WorkflowHttpRequestError("HTTP_PRIVATE_NETWORK_BLOCKED", `HTTP host '${hostname}' resolved to a private or blocked address.`);
  }
}

async function defaultResolveHostname(hostname: string): Promise<string[]> {
  if (isIP(hostname)) return [hostname];
  const records = await lookup(hostname, { all: true, verbatim: true });
  return records.map((record) => record.address);
}

function isPrivateAddress(address: string): boolean {
  if (address === "0.0.0.0" || address === "::" || address === "::1") return true;
  if (address.startsWith("fe80:") || address.startsWith("fc") || address.startsWith("fd")) return true;
  const parts = address.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) return false;
  const [a, b] = parts as [number, number, number, number];
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a >= 224) return true;
  return false;
}

function resolveSecretReferences(value: string, redactionValues: string[]): string {
  return value.replace(/secret:([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)/g, (match, namespace: string, key: string) => {
    const envName = `APIAGEX_SECRET_${namespace}_${key}`.replace(/[^A-Za-z0-9]/g, "_").toUpperCase();
    const secret = process.env[envName];
    if (!secret) throw new WorkflowHttpRequestError("HTTP_SECRET_NOT_FOUND", `Secret reference '${match}' is not configured.`);
    redactionValues.push(secret);
    return secret;
  });
}

function resolveSecretReferencesInJson(value: WorkflowJsonValue, redactionValues: string[]): WorkflowJsonValue {
  if (typeof value === "string") return resolveSecretReferences(value, redactionValues);
  if (Array.isArray(value)) return value.map((item) => resolveSecretReferencesInJson(item, redactionValues));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, resolveSecretReferencesInJson(item, redactionValues)]));
  }
  return value;
}

function redactJson(value: WorkflowJsonValue, redactionValues: string[], key = ""): WorkflowJsonValue {
  if (typeof value === "string") return redactString(value, redactionValues);
  if (Array.isArray(value)) return value.map((item) => redactJson(item, redactionValues, key));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([itemKey, item]) => [
      itemKey,
      isSensitiveKey(itemKey) ? "[REDACTED]" : redactJson(item, redactionValues, itemKey),
    ]));
  }
  if (isSensitiveKey(key)) return "[REDACTED]";
  return value;
}

function redactHeaders(headers: Record<string, string>, redactionValues: string[]): Record<string, string> {
  return Object.fromEntries(Object.entries(headers).map(([key, value]) => [
    key,
    isSensitiveKey(key) ? "[REDACTED]" : redactString(value, redactionValues),
  ]));
}

function redactString(value: string, redactionValues: string[]): string {
  let redacted = value;
  for (const secret of redactionValues) {
    if (secret) redacted = redacted.split(secret).join("[REDACTED]");
  }
  return redacted;
}

function safeResponseHeaders(headers: WorkflowHttpResponse["headers"]): Record<string, string> {
  const next: Record<string, string> = {};
  if (!headers) return next;
  if (typeof headers.forEach === "function") {
    headers.forEach((value, key) => {
      if (isSafeResponseHeader(key)) next[key.toLowerCase()] = value;
    });
    return next;
  }
  if (typeof headers.entries === "function") {
    for (const [key, value] of headers.entries()) {
      if (isSafeResponseHeader(key)) next[key.toLowerCase()] = value;
    }
  }
  return next;
}

function isSafeResponseHeader(key: string): boolean {
  const name = key.toLowerCase();
  return name === "content-type" || name === "location" || name.startsWith("x-request-") || name.startsWith("x-provider-");
}

function isSensitiveKey(key: string): boolean {
  return sensitiveKeys.has(key.replace(/[-.\s]/g, "").toLowerCase()) || sensitiveKeys.has(key.toLowerCase());
}

function isAllowedHost(hostname: string, allowedHosts: string[]): boolean {
  const host = hostname.toLowerCase();
  return allowedHosts.some((item) => {
    const allowed = item.trim().toLowerCase();
    if (!allowed) return false;
    if (allowed === host) return true;
    if (allowed.startsWith("*.")) return host.endsWith(allowed.slice(1));
    return false;
  });
}

function hostsFromEnv(): string[] {
  return (process.env.APIAGEX_WORKFLOW_HTTP_ALLOWED_HOSTS ?? "")
    .split(",")
    .map((host) => host.trim())
    .filter(Boolean);
}

function boundedInteger(value: number | undefined, fallback: number, min: number, max: number): number {
  if (value === undefined || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(value)));
}

function successStatuses(): number[] {
  return Array.from({ length: 100 }, (_, index) => 200 + index);
}

function shouldRetryStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

function isRedirectStatus(status: number): boolean {
  return status >= 300 && status < 400;
}

function stringFromJson(value: WorkflowJsonValue, name: string): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  throw new WorkflowHttpRequestError("HTTP_TEMPLATE_VALUE_MISSING", `Workflow HTTP ${name} did not resolve to a string.`);
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function defaultFetch(url: string, init: Parameters<WorkflowHttpRequestFetch>[1]): Promise<WorkflowHttpResponse> {
  const requestInit: RequestInit = {
    headers: init.headers,
    method: init.method,
    redirect: init.redirect,
    signal: init.signal,
  };
  if (init.body !== undefined) requestInit.body = init.body;
  return fetch(url, requestInit);
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

class WorkflowHttpRequestError extends Error {
  constructor(
    readonly code:
      | "HTTP_PRIVATE_NETWORK_BLOCKED"
      | "HTTP_REDIRECT_NOT_ALLOWED"
      | "HTTP_REQUEST_FAILED"
      | "HTTP_REQUEST_TIMEOUT"
      | "HTTP_RESPONSE_JSON_INVALID"
      | "HTTP_RESPONSE_TOO_LARGE"
      | "HTTP_SECRET_NOT_FOUND"
      | "HTTP_STATUS_NOT_ALLOWED"
      | "HTTP_TEMPLATE_VALUE_MISSING"
      | "HTTP_URL_NOT_ALLOWED",
    message: string,
  ) {
    super(message);
    this.name = "WorkflowHttpRequestError";
  }
}

function httpFailure(
  nodeId: string,
  code:
    | "HTTP_PRIVATE_NETWORK_BLOCKED"
    | "HTTP_REDIRECT_NOT_ALLOWED"
    | "HTTP_REQUEST_FAILED"
    | "HTTP_REQUEST_TIMEOUT"
    | "HTTP_RESPONSE_JSON_INVALID"
    | "HTTP_RESPONSE_TOO_LARGE"
    | "HTTP_SECRET_NOT_FOUND"
    | "HTTP_STATUS_NOT_ALLOWED"
    | "HTTP_TEMPLATE_VALUE_MISSING"
    | "HTTP_URL_NOT_ALLOWED"
    | "WORKFLOW_NODE_FAILED",
  message: string,
): WorkflowNodeExecutionResult<HttpRequestOutput> {
  return {
    error: { code, message, nodeId },
    nodeId,
    ok: false,
    shouldStop: true,
  };
}
