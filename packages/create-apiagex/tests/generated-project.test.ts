import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { describe, expect, it } from "vitest";
import { runCli } from "../src/index.js";
import { runRuntimeCli, startApiagexServer } from "../../server/src/runtime.js";

describe("generated Apiagex project", () => {
  it("scaffolds and runs through the runtime CLI", async () => {
    const root = await mkdtemp(join(tmpdir(), "apiagex-generated-"));
    const create = await runCli(["generated-cms", "--yes"], root);
    expect(create.code).toBe(0);

    const projectDir = join(root, "generated-cms");
    const packageJson = await readFile(join(projectDir, "package.json"), "utf8");
    expect(packageJson).toContain('"dev": "node --env-file=.env src/index.js"');
    expect(packageJson).toContain('"@apiagex/server"');
    const entry = await readFile(join(projectDir, "src/index.js"), "utf8");
    expect(entry).toContain("startApiagex");

    const smoke = await runRuntimeCli(["smoke"], { cwd: projectDir });
    expect(smoke.code).toBe(0);
    expect(smoke.stdout).toContain("Apiagex smoke passed");

    const server = await startApiagexServer({
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
    await expectText(`http://127.0.0.1:${port}/adminui`, "Apiagex");
    await expectText(`http://127.0.0.1:${port}/doc`, "Apiagex Docs");
    await expectText(`http://127.0.0.1:${port}/readme`, "Apiagex Readme");
    await server?.close();
  });
});

async function expectText(url: string, expected: string): Promise<void> {
  const response = await fetch(url);
  expect(response.status).toBe(200);
  expect(await response.text()).toContain(expected);
}
