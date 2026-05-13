import { describe, expect, it } from "vitest";
import { runRuntimeCli } from "../src/runtime.js";

describe("apiagex runtime CLI", () => {
  it("prints help", async () => {
    const result = await runRuntimeCli(["--help"]);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain("apiagex dev");
    expect(result.stdout).toContain("APIAGEX_DATABASE_PATH");
  });

  it("prints version", async () => {
    const result = await runRuntimeCli(["--version"]);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain("apiagex 0.6.2");
  });

  it("runs a health smoke check without a long-running server", async () => {
    const result = await runRuntimeCli(["smoke"], { cwd: "/tmp/generated-apiagex" });

    expect(result.code).toBe(0);
    expect(result.stdout).toContain("Apiagex smoke passed");
    expect(result.stdout).toContain("/tmp/generated-apiagex");
  });

  it("returns guidance for generated project build scripts", async () => {
    const result = await runRuntimeCli(["build"]);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain("does not need a project build");
  });

  it("rejects unknown commands", async () => {
    const result = await runRuntimeCli(["publish"]);

    expect(result.code).toBe(1);
    expect(result.stderr).toContain("Unknown apiagex command: publish");
  });
});
