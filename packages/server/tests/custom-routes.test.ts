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
    const response = await server.inject({ method: "GET", url: "/api/custom/schema-count" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ ok: true, count: 1 });
  });

  it("supports business action routes over generated entries", async () => {
    const server = createServer({
      adminAuth: "disabled",
      database: openSqliteDatabase(),
      async customRoutes(app, apiagex) {
        app.post<{ Params: { entryId: string } }>("/api/custom/orders/:entryId/pay", async (request, reply) => {
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
    const order = await server.inject({
      method: "POST",
      url: `/api/admin/schemas/${schema.json().schema.id}/entries`,
      payload: { data: { number: "A-100", status: "pending" } },
    });

    const paid = await server.inject({
      method: "POST",
      url: `/api/custom/orders/${order.json().entry.id}/pay`,
    });
    const paidAgain = await server.inject({
      method: "POST",
      url: `/api/custom/orders/${order.json().entry.id}/pay`,
    });

    expect(paid.statusCode).toBe(200);
    expect(paid.json().entry.data.status).toBe("paid");
    expect(paidAgain.statusCode).toBe(400);
    expect(paidAgain.json()).toEqual({ ok: false, error: "ORDER_NOT_PAYABLE" });
  });
});
