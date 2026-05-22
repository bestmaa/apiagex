import {
  createAutomationToken,
  createRole,
  getSchemaBySlug,
  listCustomApiPermissionEvents,
  openMigratedSqliteAdapter,
} from "@apiagex/database";
import { describe, expect, it } from "vitest";
import { createServer } from "../src/app.js";
import type { ApiagexAiPlan } from "../src/ai-plan.type.js";

describe("AI plan preview and apply APIs", () => {
  it("previews and applies additive Apiagex plans", async () => {
    const database = openMigratedSqliteAdapter();
    const token = await createAutomationToken(database, { scopes: ["plans:apply"] });
    const role = await createRole(database, { name: "public" });
    const server = createServer({ database });
    const plan: ApiagexAiPlan = {
      operations: [
        {
          id: "schema.products",
          kind: "createSchema",
          reason: "Frontend needs product records.",
          schema: {
            fields: [{ name: "Name", required: true, slug: "name", type: "text" }],
            name: "Products",
            slug: "products",
          },
        },
        {
          id: "workflow.echo",
          kind: "createWorkflowApi",
          reason: "Frontend needs a testable custom route.",
          workflow: {
            active: true,
            definition: echoWorkflowDefinition("/echo"),
            method: "POST",
            name: "Echo workflow",
            path: "/echo",
          },
        },
        {
          id: "permission.echo",
          kind: "setPermission",
          permission: {
            allowed: true,
            permissionKey: "workflow.echo.post",
            roleId: role.id,
          },
          reason: "Frontend route should be callable by the public API role.",
        },
      ],
      summary: "Create product schema and echo route.",
      title: "Product API",
      version: 1,
    };

    const preview = await server.inject({
      headers: { "x-apiagex-automation-token": token.token },
      method: "POST",
      payload: plan,
      url: "/api/ai/plans/preview",
    });
    expect(preview.statusCode).toBe(200);
    expect(preview.json().operations).toHaveLength(3);
    expect(preview.json().warnings).toEqual([]);

    const apply = await server.inject({
      headers: { "x-apiagex-automation-token": token.token },
      method: "POST",
      payload: plan,
      url: "/api/ai/plans/apply",
    });
    expect(apply.statusCode).toBe(200);
    expect(apply.json().appliedOperationIds).toEqual(["schema.products", "workflow.echo", "permission.echo"]);
    expect(await getSchemaBySlug(database, "products")).toBeTruthy();
    expect(await listCustomApiPermissionEvents(database)).toMatchObject([
      { actorEmail: "automation@apiagex.local", allowed: true, roleId: role.id },
    ]);

    const secondPreview = await server.inject({
      headers: { "x-apiagex-automation-token": token.token },
      method: "POST",
      payload: plan,
      url: "/api/ai/plans/preview",
    });
    expect(secondPreview.json().warnings).toContain("Schema products already exists and will be skipped.");
  });

  it("rejects plans without plan scope or with secret-looking data", async () => {
    const database = openMigratedSqliteAdapter();
    const wrongToken = await createAutomationToken(database, { scopes: ["schemas:manage"] });
    const plan: ApiagexAiPlan = {
      operations: [
        {
          id: "schema.products",
          kind: "createSchema",
          reason: "Frontend needs product records.",
          schema: {
            fields: [{ name: "Name", required: true, slug: "name", type: "text" }],
            name: "Products",
            slug: "products",
          },
        },
      ],
      summary: "Create product schema.",
      title: "Product API",
      version: 1,
    };
    const server = createServer({ database });

    const unauthorized = await server.inject({
      headers: { "x-apiagex-automation-token": wrongToken.token },
      method: "POST",
      payload: plan,
      url: "/api/ai/plans/preview",
    });
    expect(unauthorized.statusCode).toBe(401);
    expect(unauthorized.json().error).toBe("AUTOMATION_TOKEN_INVALID");

    const goodToken = await createAutomationToken(database, { scopes: ["plans:apply"] });
    const rejected = await server.inject({
      headers: { "x-apiagex-automation-token": goodToken.token },
      method: "POST",
      payload: {
        ...plan,
        notes: ["agx_auto_do_not_put_real_tokens_here"],
      },
      url: "/api/ai/plans/preview",
    });
    expect(rejected.statusCode).toBe(400);
    expect(rejected.json().error).toBe("AI_PLAN_SECRET_VALUE_FORBIDDEN");
  });
});

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
