import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import type { FastifyInstance, FastifyReply } from "fastify";
import { currentUploadsPath } from "./request-runtime.js";

export type MediaUploadBody = {
  contentBase64?: string;
  contentType?: string;
  filename?: string;
};

export type MediaUploadResponse = {
  ok: true;
  media: {
    contentType: string;
    filename: string;
    id: string;
    size: number;
    url: string;
  };
};

export type MediaUploadOptions = {
  allowedContentTypes?: Set<string>;
  pathSegments?: string[];
};

const allowedExtensions = new Set([".gif", ".jpg", ".jpeg", ".pdf", ".png", ".webp"]);
const allowedContentTypes = new Set([
  "application/pdf",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const maxUploadBytes = 10 * 1024 * 1024;

export function registerMediaRoutes(server: FastifyInstance, uploadsPath: string): void {
  server.post<{ Body: MediaUploadBody }>("/api/admin/media", async (request, reply) => {
    try {
      return await uploadMedia(currentUploadsPath(uploadsPath), request.body);
    } catch (error) {
      return sendMediaError(reply, error);
    }
  });
}

export async function uploadMedia(
  uploadsPath: string,
  body: MediaUploadBody,
  options: MediaUploadOptions = {},
): Promise<MediaUploadResponse> {
  const originalName = typeof body.filename === "string" ? body.filename : "";
  const filename = sanitizeFilename(originalName);
  const extension = extname(filename).toLowerCase();
  const contentType = typeof body.contentType === "string" ? body.contentType.toLowerCase() : "";
  if (!allowedExtensions.has(extension)) throw new Error("MEDIA_EXTENSION_NOT_ALLOWED");
  const contentTypes = options.allowedContentTypes ?? allowedContentTypes;
  if (!contentTypes.has(contentType)) throw new Error("MEDIA_CONTENT_TYPE_NOT_ALLOWED");
  if (typeof body.contentBase64 !== "string" || !body.contentBase64.trim()) {
    throw new Error("MEDIA_CONTENT_REQUIRED");
  }
  const bytes = Buffer.from(stripDataUrlPrefix(body.contentBase64), "base64");
  if (bytes.length === 0) throw new Error("MEDIA_CONTENT_REQUIRED");
  if (bytes.length > maxUploadBytes) throw new Error("MEDIA_TOO_LARGE");
  const id = randomUUID();
  const storedName = `${id}-${filename}`;
  const pathSegments = (options.pathSegments ?? []).map(sanitizePathSegment);
  const targetDir = join(uploadsPath, ...pathSegments);
  await mkdir(targetDir, { recursive: true });
  await writeFile(join(targetDir, storedName), bytes);
  const urlPath = ["uploads", ...pathSegments, storedName].join("/");
  return {
    media: {
      contentType,
      filename,
      id,
      size: bytes.length,
      url: `/${urlPath}`,
    },
    ok: true,
  };
}

function sanitizePathSegment(value: string): string {
  const safe = value.replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  if (!safe || safe === "." || safe === "..") throw new Error("MEDIA_PATH_INVALID");
  return safe;
}

function sanitizeFilename(value: string): string {
  const safeBase = basename(value).replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  if (!safeBase || safeBase === "." || safeBase === "..") throw new Error("MEDIA_FILENAME_INVALID");
  return safeBase;
}

function stripDataUrlPrefix(value: string): string {
  const marker = ";base64,";
  const markerIndex = value.indexOf(marker);
  return markerIndex === -1 ? value : value.slice(markerIndex + marker.length);
}

function sendMediaError(reply: FastifyReply, error: unknown): FastifyReply {
  const message = error instanceof Error ? error.message : "MEDIA_UPLOAD_FAILED";
  const statusCode = message === "MEDIA_TOO_LARGE" ? 413 : 400;
  return reply.code(statusCode).send({ ok: false, error: message });
}
