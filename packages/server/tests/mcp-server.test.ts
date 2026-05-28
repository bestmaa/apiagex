import { readFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import {
  createAutomationToken,
  createRole,
  openMigratedSqliteAdapter,
} from "@apiagex/database";
import { describe, expect, it } from "vitest";
import { createServer } from "../src/app.js";
import {
  createApiagexMcpToolRunner,
  handleApiagexMcpJsonRpcMessage,
} from "../src/mcp-server.js";

describe("Apiagex MCP server", () => {
  it("reports the package version during initialize", async () => {
    const initialized = await handleApiagexMcpJsonRpcMessage(
      { id: 1, jsonrpc: "2.0", method: "initialize" },
      { baseUrl: "http://127.0.0.1:4000" },
    );

    expect(initialized).toMatchObject({
      result: {
        serverInfo: { name: "apiagex-mcp", version: serverPackageVersion() },
      },
    });
  });

  it("lists MCP tools and calls Apiagex through secure HTTP APIs", async () => {
    const database = openMigratedSqliteAdapter();
    const token = await createAutomationToken(database, {
      scopes: ["schemas:manage", "workflows:manage", "permissions:manage", "routes:read"],
    });
    const role = await createRole(database, { name: "public" });
    const server = createServer({ database });
    await server.listen({ host: "127.0.0.1", port: 0 });
    const port = (server.server.address() as AddressInfo).port;
    const baseUrl = `http://127.0.0.1:${port}`;
    const runTool = createApiagexMcpToolRunner({ automationToken: token.token, baseUrl });

    try {
      const tools = await handleApiagexMcpJsonRpcMessage(
        { id: 1, jsonrpc: "2.0", method: "tools/list" },
        { automationToken: token.token, baseUrl },
      );
      expect(JSON.stringify(tools)).toContain("apiagex.create_schema");

      const health = parseToolText(await runTool("apiagex.health"));
      expect(health.ok).toBe(true);

      const createdSchema = parseToolText(await runTool("apiagex.create_schema", {
        fields: [
          { name: "Name", required: true, slug: "name", type: "text" },
          { name: "Status", options: ["draft", "published"], slug: "status", type: "enum" },
          { name: "Tags", options: ["new", "sale"], slug: "tags", type: "multiSelect" },
          { name: "Support Email", slug: "support-email", type: "email" },
        ],
        name: "Products",
        slug: "products",
      }));
      expect(createdSchema.schema.slug).toBe("products");

      const schemas = parseToolText(await runTool("apiagex.list_schemas"));
      expect(schemas.schemas).toMatchObject([{ slug: "products" }]);

      const workflow = parseToolText(await runTool("apiagex.create_workflow_api", {
        active: true,
        definition: echoWorkflowDefinition("/echo"),
        method: "POST",
        name: "Echo workflow",
        path: "/echo",
      }));
      expect(workflow.workflow.path).toBe("/echo");

      const routes = parseToolText(await runTool("apiagex.list_routes"));
      const route = routes.routes.find((item: { permissionKey: string }) => item.permissionKey === "workflow.echo.post");
      expect(route).toBeTruthy();

      const permission = parseToolText(await runTool("apiagex.set_permission", {
        allowed: true,
        permissionKey: "workflow.echo.post",
        roleId: role.id,
      }));
      expect(permission).toMatchObject({ allowed: true, permissionKey: "workflow.echo.post", roleId: role.id });

      const testRun = parseToolText(await runTool("apiagex.test_workflow", {
        body: { message: "hello" },
        workflowId: workflow.workflow.id,
      }));
      expect(testRun).toMatchObject({ ok: true, statusCode: 200 });

      const summary = parseToolText(await runTool("apiagex.export_summary"));
      expect(summary.markdown).toContain("products");
      expect(summary.markdown).toContain("/api/custom/echo");
    } finally {
      await server.close();
      await database.close();
    }
  }, 15_000);

  it("returns actionable MCP errors without leaking token values", async () => {
    const runTool = createApiagexMcpToolRunner({
      automationToken: undefined,
      baseUrl: "http://127.0.0.1:1",
    });

    const result = await runTool("apiagex.list_schemas");

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain("APIAGEX_AUTOMATION_TOKEN is required");
    expect(result.content[0]?.text).not.toContain("agx_auto_");
  });
});

function parseToolText(result: { content: Array<{ text: string }> }) {
  return JSON.parse(result.content[0]?.text ?? "{}");
}

function echoWorkflowDefinition(path: string) {
  return {
    edges: [{ from: "start", id: "edge-start-return", to: "return-echo" }],
    nodes: [
      { config: {}, id: "start", type: "routeTrigger" },
      {
        config: {
          body: { ok: true },
          status: 200,
        },
        id: "return-echo",
        type: "returnResponse",
      },
    ],
    route: { method: "POST", path },
    startNodeId: "start",
    version: 1,
  };
}

function serverPackageVersion(): string {
  const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
    version: string;
  };
  return packageJson.version;
}
