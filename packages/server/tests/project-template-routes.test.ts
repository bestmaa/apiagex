import {
  createRole,
  createSchema,
  createWorkflow,
  listRolePermissions,
  listRoles,
  listSchemas,
  listWorkflows,
  openMigratedSqliteAdapter,
  setPermission,
  setRealtimeConfig,
} from "@apiagex/database";
import { describe, expect, it } from "vitest";
import { createServer } from "../src/app.js";

describe("project template admin APIs", () => {
  it("exports and imports project structure without content data or tokens", async () => {
    const sourceDb = await openMigratedSqliteAdapter();
    const source = createServer({ adminAuth: "disabled", database: sourceDb });
    const schema = await createSchema(sourceDb, {
      fields: [{ name: "Title", required: true, slug: "title", type: "text" }],
      name: "Products",
      slug: "products",
    });
    const role = await createRole(sourceDb, { description: "Store admin", name: "store-admin" });
    await setPermission(sourceDb, { action: "manage", allowed: true, roleId: role.id, schemaId: schema.id });
    await setRealtimeConfig(sourceDb, {
      enabled: true,
      events: ["entry.created", "entry.updated"],
      schemaId: schema.id,
    });
    await createWorkflow(sourceDb, {
      active: true,
      definition: {
        edges: [{ from: "start", id: "edge-start-return", to: "return-ok" }],
        nodes: [
          { config: {}, id: "start", type: "routeTrigger" },
          { config: { body: { ok: true }, status: 200 }, id: "return-ok", type: "returnResponse" },
        ],
        route: { method: "GET", path: "/ping" },
        startNodeId: "start",
        version: 1,
      },
      description: "Ping",
      method: "GET",
      name: "Ping",
      path: "/ping",
      version: 1,
    });

    const exported = await source.inject({ method: "GET", url: "/api/admin/project-template" });
    expect(exported.statusCode).toBe(200);
    expect(exported.json().template.tables.schemas).toHaveLength(1);
    expect(exported.json().template.tables.roles).toEqual([
      expect.objectContaining({ name: "store-admin" }),
    ]);

    const targetDb = await openMigratedSqliteAdapter();
    const target = createServer({ adminAuth: "disabled", database: targetDb });
    const imported = await target.inject({
      method: "POST",
      payload: { template: exported.json().template },
      url: "/api/admin/project-template/import",
    });

    expect(imported.statusCode).toBe(200);
    expect(imported.json().imported.schemas).toBe(1);
    expect((await listSchemas(targetDb)).map((item) => item.slug)).toEqual(["products"]);
    expect((await listRoles(targetDb)).map((item) => item.name)).toEqual(["store-admin"]);
    expect(await listRolePermissions(targetDb, role.id)).toEqual([
      expect.objectContaining({ action: "manage", allowed: true, schemaId: schema.id }),
    ]);
    expect((await listWorkflows(targetDb)).map((item) => item.path)).toEqual(["/ping"]);
  });
});
