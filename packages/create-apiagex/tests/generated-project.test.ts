import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type { AddressInfo } from "node:net";
import { describe, expect, it } from "vitest";
import { runCli } from "../src/index.js";
import { runRuntimeCli, startApiagexServer } from "../../server/src/runtime.js";

describe("generated Apiagex project", () => {
  it("scaffolds and runs through the runtime CLI", async () => {
    const root = await mkdtemp(join(tmpdir(), "apiagex-generated-"));
    const create = await runCli(["generated-cms", "--yes", "--language", "js"], root);
    expect(create.code).toBe(0);

    const projectDir = join(root, "generated-cms");
    const packageJson = await readFile(join(projectDir, "package.json"), "utf8");
    expect(packageJson).toContain('"dev": "node --env-file=.env src/index.js"');
    expect(packageJson).toContain('"@apiagex/server"');
    const entry = await readFile(join(projectDir, "src/index.js"), "utf8");
    expect(entry).toContain("startApiagex");
    expect(entry).toContain("registerCustomRoutes");
    const codexContext = await readFile(join(projectDir, ".apiagex/codex.md"), "utf8");
    expect(codexContext).toContain("APIAGEX_BASE_URL");
    expect(codexContext).toContain("APIAGEX_AUTOMATION_TOKEN");
    expect(codexContext).toContain("Never write raw tokens");
    expect(codexContext).toContain("MCP Setup");
    await expect(readFile(join(projectDir, "src/custom-routes.js"), "utf8")).resolves.toContain("/health");

    const smoke = await runRuntimeCli(["smoke"], { cwd: projectDir });
    expect(smoke.code).toBe(0);
    expect(smoke.stdout).toContain("Apiagex smoke passed");
    const customRoutes = await import(pathToFileURL(join(projectDir, "src/custom-routes.js")).href) as {
      registerCustomRoutes: Parameters<typeof startApiagexServer>[0]["customRoutes"];
    };

    const server = await startApiagexServer({
      customRoutes: customRoutes.registerCustomRoutes,
      cwd: projectDir,
      env: {
        APIAGEX_DATABASE_PATH: "data/generated.sqlite",
        APIAGEX_UPLOADS_PATH: "uploads",
        HOST: "127.0.0.1",
        PORT: "0",
      },
    });
    expect(server).toBeTruthy();
    const port = (server?.server.address() as AddressInfo).port;
    await expectText(`http://127.0.0.1:${port}/api/health`, "apiagex");
    await expectStatus(`http://127.0.0.1:${port}/api/custom/health`, 403);
    await expectText(`http://127.0.0.1:${port}/adminui`, "Apiagex");
    await expectText(`http://127.0.0.1:${port}/doc`, "Apiagex Docs");
    await expectText(`http://127.0.0.1:${port}/readme`, "Apiagex Readme");
    await server?.close();
  }, 15_000);

  it("scaffolds TypeScript custom routes with exported Apiagex route types", async () => {
    const root = await mkdtemp(join(tmpdir(), "apiagex-generated-ts-"));
    const create = await runCli(["typed-cms", "--yes"], root);
    expect(create.code).toBe(0);

    const projectDir = join(root, "typed-cms");
    const packageJson = await readFile(join(projectDir, "package.json"), "utf8");
    expect(packageJson).toContain('"dev": "node --env-file=.env --import tsx src/index.ts"');
    expect(packageJson).toContain('"build": "tsc"');
    expect(packageJson).toContain('"types": "apiagex types"');
    expect(packageJson).toContain('"typescript"');
    expect(await readFile(join(projectDir, "tsconfig.json"), "utf8")).toContain('"strict": true');
    expect(await readFile(join(projectDir, "src/index.ts"), "utf8")).toContain("startApiagex");
    const customRoutes = await readFile(join(projectDir, "src/custom-routes.ts"), "utf8");
    expect(customRoutes).toContain("RegisterApiagexCustomRoutes");
    expect(customRoutes).toContain("type OrderData");
    expect(customRoutes).toContain("app.post<{ Params: PayOrderParams }>");
  });
});

async function expectText(url: string, expected: string): Promise<void> {
  const response = await fetch(url);
  expect(response.status).toBe(200);
  expect(await response.text()).toContain(expected);
}

async function expectStatus(url: string, status: number): Promise<void> {
  const response = await fetch(url);
  expect(response.status).toBe(status);
}
