import { mkdir, readdir, readFile, stat, appendFile } from "node:fs/promises";
import { join } from "node:path";
import type { FastifyInstance, FastifyRequest } from "fastify";

const defaultMaxFileBytes = 5 * 1024 * 1024;
const maxReadLimit = 500;

export type ApiRequestLogRecord = {
  contentLength?: number;
  durationMs: number;
  kind: "content" | "custom";
  method: string;
  path: string;
  requestId: string;
  statusCode: number;
  timestamp: string;
};

export type ApiRequestLogFile = {
  bytes: number;
  name: string;
};

export type ApiRequestLogOptions = {
  logsPath: string;
  maxFileBytes?: number;
};

export function registerApiRequestLogging(server: FastifyInstance, options: ApiRequestLogOptions): void {
  const starts = new WeakMap<FastifyRequest, number>();
  let writeQueue = Promise.resolve();
  server.addHook("onRequest", async (request) => {
    if (apiLogKind(request.url)) starts.set(request, Date.now());
  });
  server.addHook("onResponse", async (request, reply) => {
    const kind = apiLogKind(request.url);
    if (!kind) return;
    const record: ApiRequestLogRecord = {
      kind,
      method: request.method.toUpperCase(),
      path: request.url.split("?")[0] ?? request.url,
      requestId: request.id,
      statusCode: reply.statusCode,
      durationMs: Math.max(0, Date.now() - (starts.get(request) ?? Date.now())),
      timestamp: new Date().toISOString(),
      ...contentLengthField(reply.getHeader("content-length")),
    };
    writeQueue = writeQueue.catch(() => undefined).then(() => appendApiRequestLog(options, record));
    await writeQueue.catch(() => undefined);
  });
}

export async function appendApiRequestLog(options: ApiRequestLogOptions, record: ApiRequestLogRecord): Promise<void> {
  await mkdir(options.logsPath, { recursive: true });
  const file = await activeLogFile(options);
  await appendFile(file, `${JSON.stringify(record)}\n`, "utf8");
}

export async function listApiRequestLogs(
  options: ApiRequestLogOptions,
  limitInput: number | undefined,
): Promise<{ files: ApiRequestLogFile[]; logs: ApiRequestLogRecord[]; maxFileBytes: number }> {
  await mkdir(options.logsPath, { recursive: true });
  const limit = clampLimit(limitInput);
  const files = await listLogFiles(options.logsPath);
  const logs: ApiRequestLogRecord[] = [];
  for (const file of [...files].reverse()) {
    if (logs.length >= limit) break;
    const content = await readFile(join(options.logsPath, file.name), "utf8");
    const lines = content.split("\n").filter(Boolean).reverse();
    for (const line of lines) {
      if (logs.length >= limit) break;
      const parsed = parseLogRecord(line);
      if (parsed) logs.push(parsed);
    }
  }
  return { files, logs, maxFileBytes: maxFileBytes(options) };
}

async function activeLogFile(options: ApiRequestLogOptions): Promise<string> {
  const files = await listLogFiles(options.logsPath);
  const latest = files.at(-1);
  if (latest && latest.bytes < maxFileBytes(options)) return join(options.logsPath, latest.name);
  return join(options.logsPath, `api-${new Date().toISOString().replaceAll(/[:.]/g, "-")}.jsonl`);
}

async function listLogFiles(logsPath: string): Promise<ApiRequestLogFile[]> {
  const names = await readdir(logsPath).catch(() => []);
  const files = await Promise.all(
    names
      .filter((name) => name.startsWith("api-") && name.endsWith(".jsonl"))
      .sort()
      .map(async (name) => ({ name, bytes: (await stat(join(logsPath, name))).size })),
  );
  return files;
}

function parseLogRecord(line: string): ApiRequestLogRecord | undefined {
  try {
    const record = JSON.parse(line) as ApiRequestLogRecord;
    return record && typeof record.path === "string" && typeof record.timestamp === "string" ? record : undefined;
  } catch {
    return undefined;
  }
}

function apiLogKind(url: string): ApiRequestLogRecord["kind"] | undefined {
  if (url === "/api/content" || url.startsWith("/api/content/")) return "content";
  if (url === "/api/custom" || url.startsWith("/api/custom/")) return "custom";
  return undefined;
}

function contentLengthField(value: number | string | string[] | undefined): Pick<ApiRequestLogRecord, "contentLength"> {
  const first = Array.isArray(value) ? value[0] : value;
  const parsed = typeof first === "number" ? first : Number(first);
  return Number.isFinite(parsed) ? { contentLength: parsed } : {};
}

function clampLimit(value: number | undefined): number {
  if (!value || !Number.isFinite(value)) return 100;
  return Math.min(maxReadLimit, Math.max(1, Math.floor(value)));
}

function maxFileBytes(options: ApiRequestLogOptions): number {
  return options.maxFileBytes ?? defaultMaxFileBytes;
}
