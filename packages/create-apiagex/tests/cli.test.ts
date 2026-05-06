import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { runCli } from "../src/index.js";

describe("create-apiagex CLI", () => {
  it("prints help", async () => {
    const result = await runCli(["--help"]);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain("Usage:");
    expect(result.stdout).toContain("create-apiagex <target-folder>");
  });

  it("validates the target folder slug", async () => {
    const result = await runCli(["Bad Name"]);

    expect(result.code).toBe(1);
    expect(result.stderr).toContain("safe slug");
  });

  it("prints a dry-run scaffold plan without writing files", async () => {
    const root = await mkdtemp(join(tmpdir(), "create-apiagex-"));
    const result = await runCli(["my-cms", "--dry-run"], root);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain("Dry run only");
    expect(result.stdout).toContain("package.json");
    await expect(readFile(join(root, "my-cms", "package.json"), "utf8")).rejects.toThrow();
  });

  it("refuses to overwrite a non-empty target folder", async () => {
    const root = await mkdtemp(join(tmpdir(), "create-apiagex-"));
    const target = join(root, "my-cms");
    await mkdir(target);
    await writeFile(join(target, "README.md"), "keep me", "utf8");

    const result = await runCli(["my-cms"], root);

    expect(result.code).toBe(1);
    expect(result.stderr).toContain("Refusing to overwrite");
  });

  it("creates a starter scaffold in a missing folder", async () => {
    const root = await mkdtemp(join(tmpdir(), "create-apiagex-"));
    const result = await runCli(["my-cms"], root);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain("Created 7 files");
    await expect(readFile(join(root, "my-cms", "package.json"), "utf8")).resolves.toContain('"name": "my-cms"');
    await expect(readFile(join(root, "my-cms", ".env.example"), "utf8")).resolves.toContain("ADMIN_EMAIL");
    await expect(readFile(join(root, "my-cms", "README.md"), "utf8")).resolves.toContain("many-to-many");
    await expect(readFile(join(root, "my-cms", "docs/README.md"), "utf8")).resolves.toContain("/doc explains relation field types");
  });
});
