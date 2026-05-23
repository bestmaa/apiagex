import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  ensureTenantUploadsPath,
  resolveTenantUploads,
} from "../src/tenant-uploads.js";

const tempDirs: string[] = [];

describe("tenant uploads resolver", () => {
  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { force: true, recursive: true })));
  });

  it("resolves tenant uploads under the configured root", async () => {
    const root = await tempRoot();
    const uploadsPath = join(root, "pizza", "uploads");

    const resolved = resolveTenantUploads({ slug: "pizza", uploadsPath }, { root });

    expect(resolved.publicPrefix).toBe("/uploads/pizza");
    expect(resolved.tenantUploadsPath).toBe(uploadsPath);
  });

  it("creates tenant upload folders", async () => {
    const root = await tempRoot();
    const uploadsPath = join(root, "cafe-blue", "uploads");

    await ensureTenantUploadsPath({ slug: "cafe-blue", uploadsPath }, { root });

    await expect(stat(uploadsPath)).resolves.toMatchObject({ isDirectory: expect.any(Function) });
  });

  it("rejects unsafe tenant upload paths", async () => {
    const root = await tempRoot();

    expect(() => resolveTenantUploads({ slug: "bad-slug", uploadsPath: "/tmp/outside" }, { root }))
      .toThrow("TENANT_UPLOADS_PATH_OUTSIDE_ROOT");
    expect(() => resolveTenantUploads({ slug: "../bad", uploadsPath: join(root, "bad") }, { root }))
      .toThrow("TENANT_UPLOADS_SLUG_INVALID");
  });
});

async function tempRoot(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "apiagex-tenant-uploads-"));
  tempDirs.push(dir);
  return dir;
}
