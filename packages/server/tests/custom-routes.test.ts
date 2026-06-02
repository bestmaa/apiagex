import { openSqliteDatabase } from "@apiagex/database";
import { describe, expect, it } from "vitest";
import { createServer } from "../src/app.js";

describe("custom business route extension", () => {
  it("registers project routes with Apiagex helpers", async () => {
    const server = createServer({
      adminAuth: "disabled",
      database: openSqliteDatabase(),
      customRoutes(app, apiagex) {
        app.get("/api/custom/schema-count", async () => ({
          ok: true,
          count: (await apiagex.schemas.list()).length,
        }));
      },
    });

    await server.inject({
      method: "POST",
      url: "/api/admin/schemas",
      payload: {
        fields: [{ name: "Title", slug: "title", type: "text" }],
        name: "Article",
        slug: "article",
      },
    });
    const blocked = await server.inject({ method: "GET", url: "/api/custom/schema-count" });
    await allowPublicCustomApi(server, "GET", "/api/custom/schema-count");
    const response = await server.inject({ method: "GET", url: "/api/custom/schema-count" });

    expect(blocked.statusCode).toBe(403);
    expect(blocked.json()).toEqual({ ok: false, error: "CUSTOM_API_PERMISSION_DENIED" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ ok: true, count: 1 });
  });

  it("mounts relative custom routes under /api/custom and checks token permissions", async () => {
    const server = createServer({
      adminAuth: "disabled",
      database: openSqliteDatabase(),
      async customRoutes(app, apiagex) {
        app.post<{ Params: { entryId: string } }>("/orders/:entryId/pay", async (request, reply) => {
          const entry = await apiagex.entries.getById(request.params.entryId);
          if (!entry) return reply.code(404).send({ ok: false, error: "ORDER_NOT_FOUND" });
          if (entry.data.status !== "pending") {
            return reply.code(400).send({ ok: false, error: "ORDER_NOT_PAYABLE" });
          }
          return {
            ok: true,
            entry: await apiagex.entries.update(entry.id, {
              data: { ...entry.data, status: "paid" },
            }),
          };
        });
      },
    });
    const schema = await server.inject({
      method: "POST",
      url: "/api/admin/schemas",
      payload: {
        fields: [
          { name: "Number", slug: "number", type: "text", required: true },
          { name: "Status", slug: "status", type: "text", required: true },
        ],
        name: "Order",
        slug: "order",
      },
    });
    const token = await createTokenForCustomApi(server, "writer", "POST", "/api/custom/orders/:entryId/pay");
    const order = await server.inject({
      method: "POST",
      url: `/api/admin/schemas/${schema.json().schema.id}/entries`,
      payload: { data: { number: "A-100", status: "pending" } },
    });

    const blocked = await server.inject({
      method: "POST",
      url: `/api/custom/orders/${order.json().entry.id}/pay`,
    });
    const paid = await server.inject({
      method: "POST",
      url: `/api/custom/orders/${order.json().entry.id}/pay`,
      headers: { authorization: `Bearer ${token}` },
    });
    const paidAgain = await server.inject({
      method: "POST",
      url: `/api/custom/orders/${order.json().entry.id}/pay`,
      headers: { authorization: `Bearer ${token}` },
    });

    expect(blocked.statusCode).toBe(403);
    expect(paid.statusCode).toBe(200);
    expect(paid.json().entry.data.status).toBe("paid");
    expect(paidAgain.statusCode).toBe(400);
    expect(paidAgain.json()).toEqual({ ok: false, error: "ORDER_NOT_PAYABLE" });
  });

  it("allows custom APIs with a content user login token", async () => {
    const server = createServer({
      adminAuth: "disabled",
      database: openSqliteDatabase(),
      async customRoutes(app) {
        app.get("/reports/sales", async () => ({ ok: true, report: "sales" }));
      },
    });
    const roleId = await ensureApiRole(server, "report-reader");
    await allowCustomApiForRole(server, roleId, "GET", "/api/custom/reports/sales");
    await createContentUser(server, "report-reader@apiagex.local", roleId);
    const login = await loginContentUser(server, "report-reader@apiagex.local");

    const response = await server.inject({
      method: "GET",
      url: "/api/custom/reports/sales",
      headers: { authorization: `Bearer ${login.token}` },
    });

    expect(login.token).toMatch(/^agxu_/);
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ ok: true, report: "sales" });
  });

  it("supports slug-based entry helpers for custom routes", async () => {
    const server = createServer({
      adminAuth: "disabled",
      database: openSqliteDatabase(),
      async customRoutes(app, apiagex) {
        app.post("/products", async () => ({
          ok: true,
          entry: await apiagex.entries.create("products", {
            data: { name: "Phone", price: 1000 },
          }),
        }));

        app.get("/products", async () => ({
          ok: true,
          result: await apiagex.entries.query("products", { search: "Phone", limit: 10, offset: 0 }),
        }));
      },
    });

    await server.inject({
      method: "POST",
      url: "/api/admin/schemas",
      payload: {
        fields: [
          { name: "Name", slug: "name", type: "text", required: true },
          { name: "Price", slug: "price", type: "number", required: true },
        ],
        name: "Products",
        slug: "products",
      },
    });
    await allowPublicCustomApi(server, "POST", "/api/custom/products");
    await allowPublicCustomApi(server, "GET", "/api/custom/products");

    const created = await server.inject({ method: "POST", url: "/api/custom/products" });
    const listed = await server.inject({ method: "GET", url: "/api/custom/products" });

    expect(created.statusCode).toBe(200);
    expect(created.json().entry.data).toEqual({ name: "Phone", price: 1000 });
    expect(listed.statusCode).toBe(200);
    expect(listed.json().result.total).toBe(1);
    expect(listed.json().result.entries[0].data.name).toBe("Phone");
  });

  it("lists discovered custom APIs for Admin UI permissions", async () => {
    const server = createServer({
      adminAuth: "disabled",
      database: openSqliteDatabase(),
      async customRoutes(app) {
        app.get("/reports/sales", async () => ({ ok: true }));
      },
    });

    const routes = await server.inject({ method: "GET", url: "/api/admin/custom-api-routes" });

    expect(routes.statusCode).toBe(200);
    expect(routes.json().routes).toMatchObject([
      {
        active: true,
        groupName: "Reports",
        method: "GET",
        name: "Sales",
        path: "/api/custom/reports/sales",
        permissionKey: "custom.reports.sales.get",
      },
    ]);
  });

  it("persists manual route labels across rediscovery", async () => {
    const db = openSqliteDatabase();
    let server = createServer({
      adminAuth: "disabled",
      database: db,
      async customRoutes(app) {
        app.get("/reports/sales", async () => ({ ok: true }));
      },
    });
    const route = (await server.inject({ method: "GET", url: "/api/admin/custom-api-routes" })).json().routes[0];

    const renamed = await server.inject({
      method: "PUT",
      payload: { groupName: "Finance", name: "Sales export" },
      url: `/api/admin/custom-api-routes/${route.id}`,
    });
    server = createServer({
      adminAuth: "disabled",
      database: db,
      async customRoutes(app) {
        app.get("/reports/sales", async () => ({ ok: true }));
      },
    });
    const rediscovered = await server.inject({ method: "GET", url: "/api/admin/custom-api-routes" });

    expect(renamed.statusCode).toBe(200);
    expect(rediscovered.json().routes[0]).toMatchObject({
      groupName: "Finance",
      name: "Sales export",
      path: "/api/custom/reports/sales",
    });
  });

  it("records custom API permission history and deletes inactive routes only", async () => {
    const db = openSqliteDatabase();
    let server = createServer({
      adminAuth: "disabled",
      database: db,
      async customRoutes(app) {
        app.post("/orders/:entryId/pay", async () => ({ ok: true }));
      },
    });
    const roleId = await ensureApiRole(server, "writer");
    const route = (await server.inject({ method: "GET", url: "/api/admin/custom-api-routes" })).json().routes[0];
    const blockedDelete = await server.inject({
      method: "DELETE",
      url: `/api/admin/custom-api-routes/${route.id}`,
    });
    await server.inject({
      method: "PUT",
      payload: { permissions: [{ allowed: true, customApiRouteId: route.id }] },
      url: `/api/admin/roles/${roleId}/custom-api-permissions`,
    });
    await server.inject({
      method: "PUT",
      payload: { permissions: [{ allowed: false, customApiRouteId: route.id }] },
      url: `/api/admin/roles/${roleId}/custom-api-permissions`,
    });
    const history = await server.inject({
      method: "GET",
      url: `/api/admin/custom-api-routes/${route.id}/history`,
    });

    server = createServer({
      adminAuth: "disabled",
      database: db,
      async customRoutes() {},
    });
    const inactive = (await server.inject({ method: "GET", url: "/api/admin/custom-api-routes" })).json().routes[0];
    const deleted = await server.inject({
      method: "DELETE",
      url: `/api/admin/custom-api-routes/${inactive.id}`,
    });
    const afterDelete = await server.inject({ method: "GET", url: "/api/admin/custom-api-routes" });

    expect(blockedDelete.statusCode).toBe(400);
    expect(blockedDelete.json().error).toBe("CUSTOM_API_ROUTE_ACTIVE");
    expect(history.json().events.map((event: { allowed: boolean }) => event.allowed)).toEqual([false, true]);
    expect(deleted.statusCode).toBe(200);
    expect(afterDelete.json().routes).toEqual([]);
  });
});

async function allowPublicCustomApi(server: ReturnType<typeof createServer>, method: string, path: string): Promise<void> {
  const roleId = await ensureApiRole(server, "public");
  await allowCustomApiForRole(server, roleId, method, path);
}

async function createTokenForCustomApi(
  server: ReturnType<typeof createServer>,
  roleName: string,
  method: string,
  path: string,
): Promise<string> {
  const roleId = await ensureApiRole(server, roleName);
  await allowCustomApiForRole(server, roleId, method, path);
  const token = await server.inject({
    method: "POST",
    payload: { name: `${roleName} token` },
    url: `/api/admin/roles/${roleId}/tokens`,
  });
  return token.json().token;
}

async function ensureApiRole(server: ReturnType<typeof createServer>, name: string): Promise<string> {
  const list = await server.inject({ method: "GET", url: "/api/admin/roles" });
  const existing = list.json().roles.find((role: { name: string }) => role.name === name);
  if (existing) return existing.id;
  const created = await server.inject({ method: "POST", payload: { name }, url: "/api/admin/roles" });
  return created.json().role.id;
}

async function allowCustomApiForRole(
  server: ReturnType<typeof createServer>,
  roleId: string,
  method: string,
  path: string,
): Promise<void> {
  const routeList = await server.inject({ method: "GET", url: "/api/admin/custom-api-routes" });
  const route = routeList.json().routes.find((item: { method: string; path: string }) =>
    item.method === method && item.path === path,
  );
  expect(route).toBeTruthy();
  const save = await server.inject({
    method: "PUT",
    payload: { permissions: [{ allowed: true, customApiRouteId: route.id }] },
    url: `/api/admin/roles/${roleId}/custom-api-permissions`,
  });
  expect(save.statusCode).toBe(200);
}

async function createContentUser(
  server: ReturnType<typeof createServer>,
  email: string,
  roleId: string,
): Promise<void> {
  const response = await server.inject({
    method: "POST",
    payload: { email, password: "UserPass123!", roleId },
    url: "/api/admin/users",
  });
  expect(response.statusCode).toBe(200);
}

async function loginContentUser(
  server: ReturnType<typeof createServer>,
  email: string,
): Promise<{ token: string }> {
  const response = await server.inject({
    method: "POST",
    payload: { email, password: "UserPass123!" },
    url: "/api/auth/login-user",
  });
  expect(response.statusCode).toBe(200);
  return response.json() as { token: string };
}
