import {
  openMigratedSqliteAdapter,
  type ApiagexDatabase,
  type DatabaseQueryParam,
} from "@apiagex/database";
import { describe, expect, it } from "vitest";
import { createServer } from "../src/app.js";
import { shouldPopulateRelations } from "../src/relation-populate.js";

describe("relation populate query parsing", () => {
  it("accepts relation populate aliases", () => {
    expect(shouldPopulateRelations("relations")).toBe(true);
    expect(shouldPopulateRelations("all")).toBe(true);
    expect(shouldPopulateRelations("*")).toBe(true);
  });

  it("ignores unknown populate values without throwing", () => {
    expect(shouldPopulateRelations("media")).toBe(false);
    expect(shouldPopulateRelations("deep")).toBe(false);
    expect(shouldPopulateRelations(undefined)).toBe(false);
  });

  it("batch populates content list relations without per-entry lookups", async () => {
    const counted = createCountingDatabase();
    const server = createServer({ adminAuth: "disabled", database: counted.database });
    const productSchemaId = await createSchema(server, {
      name: "Product",
      slug: "products",
      fields: [{ name: "Name", slug: "name", type: "text", required: true }],
    });
    const orderItemSchemaId = await createSchema(server, {
      name: "Order Item",
      slug: "order-items",
      fields: [
        { name: "Title", slug: "title", type: "text", required: true },
        {
          name: "Product",
          slug: "product",
          type: "relation",
          relationSchemaId: productSchemaId,
          relationType: "manyToOne",
          required: true,
        },
      ],
    });
    await allowPublicActions(server, productSchemaId, ["get"]);
    await allowPublicActions(server, orderItemSchemaId, ["getAll"]);

    const productIds: string[] = [];
    for (let index = 0; index < 3; index += 1) {
      productIds.push(await createEntry(server, productSchemaId, { name: `Product ${index + 1}` }));
    }
    for (let index = 0; index < 27; index += 1) {
      await createEntry(server, orderItemSchemaId, {
        title: `Order item ${index + 1}`,
        product: productIds[index % productIds.length],
      });
    }

    counted.takeQueries();
    const response = await server.inject({
      method: "GET",
      url: "/api/content/order-items?populate=relations&limit=27",
    });
    const queries = counted.takeQueries();

    expect(response.statusCode).toBe(200);
    expect(response.json().entries).toHaveLength(27);
    expect(response.json().entries[0].data.product).toMatchObject({
      schemaId: productSchemaId,
      data: expect.objectContaining({ name: expect.any(String) }),
    });
    expect(countSql(queries, "FROM entries WHERE id = ?")).toBe(0);
    expect(countSql(queries, "FROM entries WHERE id IN")).toBe(1);
  });
});

function createCountingDatabase(): { database: ApiagexDatabase; takeQueries: () => string[] } {
  const inner = openMigratedSqliteAdapter();
  let queries: string[] = [];
  return {
    database: {
      provider: inner.provider,
      exec: (sql) => inner.exec(sql),
      prepare: (sql) => {
        const statement = inner.prepare(sql);
        return {
          get: async <TRecord = unknown>(...params: DatabaseQueryParam[]) => {
            queries.push(sql);
            return statement.get<TRecord>(...params);
          },
          all: async <TRecord = unknown>(...params: DatabaseQueryParam[]) => {
            queries.push(sql);
            return statement.all<TRecord>(...params);
          },
          run: async (...params: DatabaseQueryParam[]) => {
            queries.push(sql);
            return statement.run(...params);
          },
        };
      },
      transaction: (callback) => inner.transaction(callback),
      close: () => inner.close(),
    },
    takeQueries: () => {
      const current = queries;
      queries = [];
      return current;
    },
  };
}

function countSql(queries: string[], fragment: string): number {
  return queries.filter((sql) => sql.includes(fragment)).length;
}

async function createSchema(
  server: ReturnType<typeof createServer>,
  payload: {
    name: string;
    slug: string;
    fields: Array<Record<string, unknown>>;
  },
): Promise<string> {
  const response = await server.inject({ method: "POST", url: "/api/admin/schemas", payload });
  expect(response.statusCode).toBe(200);
  return response.json().schema.id as string;
}

async function createEntry(
  server: ReturnType<typeof createServer>,
  schemaId: string,
  data: Record<string, unknown>,
): Promise<string> {
  const response = await server.inject({
    method: "POST",
    url: `/api/admin/schemas/${schemaId}/entries`,
    payload: { data },
  });
  expect(response.statusCode).toBe(200);
  return response.json().entry.id as string;
}

type ApiAction = "getAll" | "get" | "create" | "update" | "delete" | "manage";

async function allowPublicActions(
  server: ReturnType<typeof createServer>,
  schemaId: string,
  actions: ApiAction[],
): Promise<void> {
  const role = await getOrCreatePublicRole(server);
  const response = await server.inject({
    method: "PUT",
    url: `/api/admin/roles/${role}/permissions`,
    payload: { permissions: actions.map((action) => ({ schemaId, action, allowed: true })) },
  });
  expect(response.statusCode).toBe(200);
}

async function createRole(server: ReturnType<typeof createServer>, name: string): Promise<string> {
  const response = await server.inject({
    method: "POST",
    url: "/api/admin/roles",
    payload: { name },
  });
  expect(response.statusCode).toBe(200);
  return response.json().role.id as string;
}

async function getOrCreatePublicRole(server: ReturnType<typeof createServer>): Promise<string> {
  const list = await server.inject({ method: "GET", url: "/api/admin/roles" });
  const existing = (list.json().roles as Array<{ id: string; name: string }>).find((role) => role.name === "public");
  return existing?.id ?? createRole(server, "public");
}
