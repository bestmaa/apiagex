import {
  createSchema,
  deleteEntry,
  deleteSchema,
  deleteWorkflow,
  getWorkflowById,
  listEntries,
  listWorkflows,
  openMigratedSqliteAdapter,
  openMySqlAdapter,
  openPostgresAdapter,
  updateWorkflow,
  createWorkflow,
  type ApiagexDatabase,
} from "@apiagex/database";
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  createWorkflowExecutionContext,
  executeWorkflowDefinition,
  type WorkflowDefinition,
} from "../src/index.js";

type ProviderCase = {
  name: string;
  open: () => Promise<ApiagexDatabase> | ApiagexDatabase;
  required?: boolean;
};

const providerCases: ProviderCase[] = [
  {
    name: "sqlite",
    open: () => openMigratedSqliteAdapter(),
    required: true,
  },
  {
    name: "postgres",
    open: () => openPostgresAdapter(process.env.APIAGEX_TEST_POSTGRES_URL),
    required: Boolean(process.env.APIAGEX_TEST_POSTGRES_URL),
  },
  {
    name: "mysql",
    open: () => openMySqlAdapter(process.env.APIAGEX_TEST_MYSQL_URL),
    required: Boolean(process.env.APIAGEX_TEST_MYSQL_URL),
  },
];

describe("workflow provider E2E", () => {
  for (const provider of providerCases) {
    const run = provider.required ? it : it.skip;
    run(`stores and executes workflows on ${provider.name}`, async () => {
      const db = await provider.open();
      const suffix = randomUUID().slice(0, 8);
      const schemaSlug = `e2e-products-${suffix}`;
      let schemaId = "";
      let workflowId = "";
      try {
        const schema = await createSchema(db, {
          fields: [
            { name: "Name", required: true, slug: "name", type: "text" },
            { name: "Status", required: false, slug: "status", type: "text" },
          ],
          name: `E2E Products ${suffix}`,
          slug: schemaSlug,
        });
        schemaId = schema.id;

        const workflowDefinition = providerWorkflowDefinition(schemaSlug);
        const workflow = await createWorkflow(db, {
          active: false,
          definition: workflowDefinition,
          description: "Provider E2E workflow",
          method: "POST",
          name: `Provider E2E ${suffix}`,
          path: `/provider-e2e-${suffix}`,
          version: 1,
        });
        workflowId = workflow.id;

        expect(await getWorkflowById(db, workflow.id)).toMatchObject({
          id: workflow.id,
          method: "POST",
          path: `/provider-e2e-${suffix}`,
        });
        expect((await listWorkflows(db)).some((item) => item.id === workflow.id)).toBe(true);

        const updated = await updateWorkflow(db, workflow.id, {
          active: true,
          description: "Provider E2E workflow updated",
          method: "POST",
          name: `Provider E2E ${suffix}`,
          path: `/provider-e2e-${suffix}`,
          version: 1,
        });
        expect(updated.active).toBe(true);

        const context = createWorkflowExecutionContext({
          body: { name: "Phone", search: "phone" },
        });
        const result = await executeWorkflowDefinition(db, context, workflowDefinition);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.response.status).toBe(201);
          expect(result.response.body).toMatchObject({
            created: "Phone",
            ok: true,
            total: 1,
          });
        }
        expect(await listEntries(db, schema.id)).toHaveLength(1);
      } finally {
        if (workflowId) await deleteWorkflow(db, workflowId).catch(() => undefined);
        if (schemaId) {
          const entries = await listEntries(db, schemaId).catch(() => []);
          for (const entry of entries) await deleteEntry(db, entry.id).catch(() => undefined);
          await deleteSchema(db, schemaId).catch(() => undefined);
        }
        await db.close?.();
      }
    });
  }
});

function providerWorkflowDefinition(schema: string): WorkflowDefinition {
  return {
    edges: [
      { from: "start", id: "edge-start-create", to: "create-product" },
      { from: "create-product", id: "edge-create-query", to: "find-products" },
      { from: "find-products", id: "edge-query-return", to: "return-created" },
    ],
    nodes: [
      { config: {}, id: "start", type: "routeTrigger" },
      {
        config: {
          data: {
            name: "{{body.name}}",
            status: "active",
          },
          schema,
        },
        id: "create-product",
        type: "createEntry",
      },
      {
        config: {
          limit: 20,
          schema,
          search: "{{body.search}}",
        },
        id: "find-products",
        type: "queryEntries",
      },
      {
        config: {
          body: {
            created: "{{steps.create-product.entry.data.name}}",
            ok: true,
            total: "{{steps.find-products.total}}",
          },
          status: 201,
        },
        id: "return-created",
        type: "returnResponse",
      },
    ],
    route: { method: "POST", path: "/provider-e2e" },
    startNodeId: "start",
    version: 1,
  };
}
