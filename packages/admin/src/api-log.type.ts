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

export type ApiRequestLogResponse = {
  error?: string;
  files?: ApiRequestLogFile[];
  logs?: ApiRequestLogRecord[];
  maxFileBytes?: number;
  ok: boolean;
};
