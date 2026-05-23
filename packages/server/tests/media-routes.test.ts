import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openSqliteDatabase } from "@apiagex/database";
import { afterEach, describe, expect, it } from "vitest";
import { createServer } from "../src/app.js";

const tempDirs: string[] = [];

describe("media admin APIs", () => {
  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { force: true, recursive: true })));
  });

  it("uploads media centrally and serves the returned URL", async () => {
    const uploadsPath = await tempUploadsPath();
    const server = createServer({ adminAuth: "disabled", database: openSqliteDatabase(), uploadsPath });

    const upload = await server.inject({
      method: "POST",
      payload: {
        contentBase64: Buffer.from("hello media").toString("base64"),
        contentType: "image/png",
        filename: "../hero image.png",
      },
      url: "/api/admin/media",
    });

    expect(upload.statusCode).toBe(200);
    expect(upload.json().media).toMatchObject({
      contentType: "image/png",
      filename: "hero-image.png",
      size: 11,
    });
    expect(upload.json().media.url).toMatch(/^\/uploads\/.+-hero-image\.png$/);

    const served = await server.inject({ method: "GET", url: upload.json().media.url });
    expect(served.statusCode).toBe(200);
    expect(served.body).toBe("hello media");
  });

  it("rejects unsupported uploads", async () => {
    const uploadsPath = await tempUploadsPath();
    const server = createServer({ adminAuth: "disabled", database: openSqliteDatabase(), uploadsPath });

    const upload = await server.inject({
      method: "POST",
      payload: {
        contentBase64: Buffer.from("alert(1)").toString("base64"),
        contentType: "application/javascript",
        filename: "bad.js",
      },
      url: "/api/admin/media",
    });

    expect(upload.statusCode).toBe(400);
    expect(upload.json()).toEqual({ ok: false, error: "MEDIA_EXTENSION_NOT_ALLOWED" });
  });
});

async function tempUploadsPath(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "apiagex-media-"));
  tempDirs.push(dir);
  return dir;
}
