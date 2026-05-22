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
    expect(result.stdout).toContain("create-apiagex [target-folder]");
  });

  it("validates the target folder slug", async () => {
    const result = await runCli(["Bad Name"]);

    expect(result.code).toBe(1);
    expect(result.stderr).toContain("safe slug");
  });

  it("prints a dry-run scaffold plan without writing files", async () => {
    const root = await mkdtemp(join(tmpdir(), "create-apiagex-"));
    const result = await runCli([
      "my-cms",
      "--dry-run",
      "--package-manager",
      "pnpm",
      "--language",
      "ts",
      "--setup",
      "custom",
      "--install",
      "--git",
      "--database-path",
      "data/custom.sqlite",
      "--host",
      "0.0.0.0",
      "--port",
      "5050",
    ], root);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain("Dry run only");
    expect(result.stdout).toContain("Package manager: pnpm");
    expect(result.stdout).toContain("Language: TypeScript");
    expect(result.stdout).toContain("Setup mode: custom");
    expect(result.stdout).toContain("SQLite path: data/custom.sqlite");
    expect(result.stdout).toContain("Server: http://0.0.0.0:5050");
    expect(result.stdout).toContain("package.json");
    expect(result.stdout).toContain(".apiagex/codex.md");
    await expect(readFile(join(root, "my-cms", "package.json"), "utf8")).rejects.toThrow();
  });

  it("prompts for setup answers when interactive", async () => {
    const root = await mkdtemp(join(tmpdir(), "create-apiagex-"));
    const answers = ["prompt-cms", "ts", "custom", "sqlite", "data/prompt.sqlite", "0.0.0.0", "5050", "yarn", "yes", "owner@example.com", "OwnerPass123!", "no", "yes"];
    const result = await runCli(["--dry-run"], root, {
      interactive: true,
      prompt: async () => answers.shift() ?? "",
    });

    expect(result.code).toBe(0);
    expect(result.stdout).toContain("prompt-cms");
    expect(result.stdout).toContain("Setup mode: custom");
    expect(result.stdout).toContain("SQLite path: data/prompt.sqlite");
    expect(result.stdout).toContain("Server: http://0.0.0.0:5050");
    expect(result.stdout).toContain("Package manager: yarn");
    expect(result.stdout).toContain("Language: TypeScript");
    expect(result.stdout).toContain("Install dependencies: yes");
    expect(result.stdout).toContain("Initialize git: no");
    expect(result.stdout).toContain("Owner setup: create from .env on first start");
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
    expect(result.stdout).toContain("Created 11 files");
    await expect(readFile(join(root, "my-cms", "package.json"), "utf8")).resolves.toContain('"name": "my-cms"');
    await expect(readFile(join(root, "my-cms", "package.json"), "utf8")).resolves.toContain('"@apiagex/server"');
    await expect(readFile(join(root, "my-cms", "package.json"), "utf8")).resolves.toContain('"dev": "node --env-file=.env --import tsx src/index.ts"');
    await expect(readFile(join(root, "my-cms", "package.json"), "utf8")).resolves.toContain('"types": "apiagex types"');
    await expect(readFile(join(root, "my-cms", "package.json"), "utf8")).resolves.toContain('"ai": "apiagex ai"');
    await expect(readFile(join(root, "my-cms", "package.json"), "utf8")).resolves.toContain('"mcp": "apiagex mcp"');
    await expect(readFile(join(root, "my-cms", "package.json"), "utf8")).resolves.toContain('"typescript"');
    await expect(readFile(join(root, "my-cms", ".env"), "utf8")).resolves.toContain("APIAGEX_SECRET=");
    await expect(readFile(join(root, "my-cms", ".env.example"), "utf8")).resolves.toContain("APIAGEX_DATABASE_PATH");
    await expect(readFile(join(root, "my-cms", ".gitignore"), "utf8")).resolves.toContain("!.apiagex/codex.md");
    await expect(readFile(join(root, "my-cms", ".apiagex/codex.md"), "utf8")).resolves.toContain("APIAGEX_AUTOMATION_TOKEN");
    await expect(readFile(join(root, "my-cms", ".apiagex/codex.md"), "utf8")).resolves.toContain("Do not commit real tokens");
    await expect(readFile(join(root, "my-cms", ".apiagex/codex.md"), "utf8")).resolves.toContain("http://127.0.0.1:4000");
    await expect(readFile(join(root, "my-cms", ".apiagex/codex.md"), "utf8")).resolves.toContain("npm run mcp");
    await expect(readFile(join(root, "my-cms", "apiagex.config.json"), "utf8")).resolves.toContain('"setupMode"');
    await expect(readFile(join(root, "my-cms", "apiagex.config.json"), "utf8")).resolves.toContain('"language": "ts"');
    await expect(readFile(join(root, "my-cms", "tsconfig.json"), "utf8")).resolves.toContain('"strict": true');
    await expect(readFile(join(root, "my-cms", "src/index.ts"), "utf8")).resolves.toContain("startApiagex");
    await expect(readFile(join(root, "my-cms", "src/index.ts"), "utf8")).resolves.toContain("registerCustomRoutes");
    await expect(readFile(join(root, "my-cms", "src/custom-routes.ts"), "utf8")).resolves.toContain("/orders/:entryId/pay");
    await expect(readFile(join(root, "my-cms", "README.md"), "utf8")).resolves.toContain("Practical flow");
    await expect(readFile(join(root, "my-cms", "README.md"), "utf8")).resolves.toContain("src/apiagex-types.ts");
    await expect(readFile(join(root, "my-cms", "README.md"), "utf8")).resolves.toContain("Codex and MCP");
    await expect(readFile(join(root, "my-cms", "README.md"), "utf8")).resolves.toContain("npm run mcp");
    await expect(readFile(join(root, "my-cms", "README.md"), "utf8")).resolves.toContain("REALTIME_SESSION_INVALID");
    await expect(readFile(join(root, "my-cms", "README.md"), "utf8")).resolves.toContain("many-to-many");
    await expect(readFile(join(root, "my-cms", "docs/README.md"), "utf8")).resolves.toContain("Workflow APIs");
    await expect(readFile(join(root, "my-cms", "docs/README.md"), "utf8")).resolves.toContain("Register template");
    await expect(readFile(join(root, "my-cms", "docs/README.md"), "utf8")).resolves.toContain("Authorization: Bearer API_TOKEN");
    await expect(readFile(join(root, "my-cms", "docs/README.md"), "utf8")).resolves.toContain("Webhooks and Realtime");
  });

  it("can create a JavaScript starter when requested", async () => {
    const root = await mkdtemp(join(tmpdir(), "create-apiagex-"));
    const result = await runCli(["js-cms", "--language", "js"], root);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain("Language: JavaScript");
    expect(result.stdout).toContain("Created 10 files");
    await expect(readFile(join(root, "js-cms", "package.json"), "utf8")).resolves.toContain('"dev": "node --env-file=.env src/index.js"');
    await expect(readFile(join(root, "js-cms", "package.json"), "utf8")).resolves.toContain('"ai": "apiagex ai"');
    await expect(readFile(join(root, "js-cms", "package.json"), "utf8")).resolves.toContain('"mcp": "apiagex mcp"');
    await expect(readFile(join(root, "js-cms", ".apiagex/codex.md"), "utf8")).resolves.toContain("Safe Workflow");
    await expect(readFile(join(root, "js-cms", "src/index.js"), "utf8")).resolves.toContain("startApiagex");
    await expect(readFile(join(root, "js-cms", "src/custom-routes.js"), "utf8")).resolves.toContain("/health");
    await expect(readFile(join(root, "js-cms", "tsconfig.json"), "utf8")).rejects.toThrow();
  });

  it("creates PostgreSQL scaffold files with database URL env", async () => {
    const root = await mkdtemp(join(tmpdir(), "create-apiagex-"));
    const result = await runCli([
      "pg-cms",
      "--database",
      "postgres",
      "--database-url",
      "postgres://apiagex:secret@localhost:5432/apiagex",
    ], root);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain("Database: postgres");
    expect(result.stdout).toContain("Database URL: postgres://apiagex:secret@localhost:5432/apiagex");
    await expect(readFile(join(root, "pg-cms", ".env"), "utf8")).resolves.toContain(
      "APIAGEX_DATABASE_PROVIDER=postgres",
    );
    await expect(readFile(join(root, "pg-cms", ".env"), "utf8")).resolves.toContain(
      "APIAGEX_DATABASE_URL=postgres://apiagex:secret@localhost:5432/apiagex",
    );
    await expect(readFile(join(root, "pg-cms", ".env"), "utf8")).resolves.not.toContain("APIAGEX_DATABASE_PATH");
    await expect(readFile(join(root, "pg-cms", "apiagex.config.json"), "utf8")).resolves.toContain(
      '"urlEnv": "APIAGEX_DATABASE_URL"',
    );
  });

  it("supports MySQL in dry-run setup", async () => {
    const root = await mkdtemp(join(tmpdir(), "create-apiagex-"));
    const result = await runCli([
      "mysql-cms",
      "--dry-run",
      "--database",
      "mysql",
      "--database-url",
      "mysql://apiagex:secret@localhost:3306/apiagex",
    ], root);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain("Database: mysql");
    expect(result.stdout).toContain("Database URL: mysql://apiagex:secret@localhost:3306/apiagex");
  });

  it("uses defaults with --yes in non-interactive scripts", async () => {
    const root = await mkdtemp(join(tmpdir(), "create-apiagex-"));
    const result = await runCli(["yes-cms", "--yes", "--dry-run"], root);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain("Setup mode: quickstart");
    expect(result.stdout).toContain("Database: sqlite");
    expect(result.stdout).toContain("Language: TypeScript");
    expect(result.stdout).toContain("Package manager: npm");
    expect(result.stdout).toContain("Install dependencies: no");
  });

  it("writes first owner bootstrap env when requested", async () => {
    const root = await mkdtemp(join(tmpdir(), "create-apiagex-"));
    const result = await runCli([
      "owner-cms",
      "--owner",
      "--owner-email",
      "owner@example.com",
      "--owner-password",
      "OwnerPass123!",
    ], root);

    expect(result.code).toBe(0);
    await expect(readFile(join(root, "owner-cms", ".env"), "utf8")).resolves.toContain("APIAGEX_OWNER_EMAIL=owner@example.com");
    await expect(readFile(join(root, "owner-cms", ".env"), "utf8")).resolves.toContain("APIAGEX_OWNER_PASSWORD=OwnerPass123!");
  });
});
